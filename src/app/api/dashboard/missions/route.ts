import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedCampusId, validateCampusAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // Authentication check
    const auth = await getAuthenticatedCampusId();
    if (auth.error) return auth.error;

    try {
        const now = new Date();
        const missions: any[] = [];

        const searchParams = request.nextUrl.searchParams;
        const campusId = parseInt(searchParams.get('campusId') || '0');

        // Verify campus access
        const accessError = validateCampusAccess(campusId, auth.campusId);
        if (accessError) return accessError;

        // 1. Get all schools with test dates (Lightweight payload)
        const schools = await prisma.school.findMany({
            where: {
                testDates: { not: '[]' },
                campusId: auth.campusId,
            },
            include: {
                campus: true,
                students: {
                    select: { id: true, name: true, grade: true } // Reduce payload
                }
            }
        });

        // 2. Get all collected records (Lightweight payload)
        const collectedRecords = await prisma.testMaster.findMany({
            where: {
                status: 'COLLECTED',
                campusId: auth.campusId,
            },
            select: {
                schoolId: true,
                grade: true,
                semester: true,
                year: true,
                subject: true,
                collectionType: true
            }
        });

        // 3. Iterate schools and check for uncollected tests
        for (const school of schools) {
            try {
                const testDates = JSON.parse(school.testDates as string);
                if (!Array.isArray(testDates)) continue;

                for (const test of testDates) {
                    if (test.collectEnabled === false) continue;

                    const startDate = new Date(test.start);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(test.end);
                    endDate.setHours(23, 59, 59, 999); // End of test day
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);

                    // If test has ended (today is AFTER end date)
                    if (today > endDate) {
                        // Check deadline (1 month after test end)
                        const deadline = new Date(endDate);
                        deadline.setMonth(deadline.getMonth() + 1);
                        if (today > deadline) {
                            // Deadline passed, skip this test
                            continue;
                        }

                        // Check if collected for each target grade
                        const targetGrades = test.collectGrades || ['中1', '中2', '中3'];

                        for (const grade of targetGrades) {
                            const testYear = new Date(test.start).getFullYear();

                            // Determine subjects based on test type
                            const isFinal = test.name?.includes('期末');
                            const requiredSubjects = isFinal
                                ? ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術', '家庭']
                                : ['国語', '数学', '英語', '理科', '社会'];

                            // Check if ALL subjects are collected for this test/grade
                            const collectedSubjects = collectedRecords.filter(r =>
                                r.schoolId === school.id &&
                                r.grade === grade &&
                                r.semester === test.name &&
                                r.year === testYear &&
                                r.collectionType === 'BOTH' // Only count fully collected
                            );

                            // If not all subjects are collected, show as uncollected
                            const allCollected = requiredSubjects.every(subject =>
                                collectedSubjects.some(c => c.subject === subject)
                            );

                            if (!allCollected) {
                                // Get students for this school and grade
                                const gradeStudents = (school as any).students?.filter((s: any) => s.grade === grade) || [];
                                const studentNames = gradeStudents.map((s: any) => s.name);

                                missions.push({
                                    id: `${school.id}-${test.id}-${grade}`, // Virtual ID
                                    school: school,
                                    campus: school.campus,
                                    grade: grade,
                                    semester: test.name,
                                    deadline: test.end,
                                    status: 'PENDING',
                                    studentNames: studentNames
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing school test dates', e);
            }
        }

        // Sort by deadline desc (newest first)
        missions.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

        return NextResponse.json(missions.slice(0, 10));
    } catch (error) {
        console.error('Failed to fetch missions:', error);
        return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }
}

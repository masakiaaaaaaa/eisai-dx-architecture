import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedCampusId, validateCampusAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // Authentication check
    const auth = await getAuthenticatedCampusId();
    if (auth.error) return auth.error;

    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const searchParams = request.nextUrl.searchParams;
        const campusId = parseInt(searchParams.get('campusId') || '0');

        // Verify campus access
        const accessError = validateCampusAccess(campusId, auth.campusId);
        if (accessError) return accessError;

        // 1. Active Missions (Uncollected Tests) - Dynamic calculation
        // Get all schools with test dates
        const schools = await prisma.school.findMany({
            where: {
                testDates: { not: '[]' },
                campusId: auth.campusId,
            }
        });

        // Get all collected records
        const collectedRecords = await prisma.testMaster.findMany({
            where: {
                status: 'COLLECTED',
                campusId: auth.campusId,
            }
        });

        let activeMissionsCount = 0;
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        for (const school of schools) {
            try {
                const testDates = JSON.parse(school.testDates as string);
                if (!Array.isArray(testDates)) continue;

                for (const test of testDates) {
                    if (test.collectEnabled === false) continue;

                    const endDate = new Date(test.end);
                    endDate.setHours(23, 59, 59, 999); // End of test day

                    // If test has ended (today is AFTER test end date)
                    if (today > endDate) {
                        // Check deadline (1 month after test end)
                        const deadline = new Date(endDate);
                        deadline.setMonth(deadline.getMonth() + 1);
                        if (today > deadline) {
                            // Deadline passed, skip this test (it's expired/archive)
                            continue;
                        }

                        const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                        const testYear = new Date(test.start).getFullYear();

                        for (const grade of targetGrades) {
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
                                r.collectionType === 'BOTH'
                            );

                            // If not all subjects are collected, count as uncollected
                            const allCollected = requiredSubjects.every(subject =>
                                collectedSubjects.some(c => c.subject === subject)
                            );

                            if (!allCollected) {
                                activeMissionsCount++;
                            }
                        }
                    }
                }
            } catch (e) {
                // ignore parse error
            }
        }

        // 2. Collected This Month
        const collectedThisMonthCount = await prisma.testMaster.count({
            where: {
                status: 'COLLECTED',
                campusId: auth.campusId,
                collectedAt: {
                    gte: firstDayOfMonth,
                },
            },
        });

        // 3. Upcoming Events (Next 30 days)
        const thirtyDaysLater = new Date(now);
        thirtyDaysLater.setDate(now.getDate() + 30);

        const upcomingEventsCount = await prisma.event.count({
            where: {
                campusId: auth.campusId,
                date: {
                    gte: now,
                    lte: thirtyDaysLater,
                },
            },
        });

        const nextEvent = await prisma.event.findFirst({
            where: {
                campusId: auth.campusId,
                date: { gte: now },
            },
            orderBy: { date: 'asc' },
        });

        // 4. Top Hunter (This Month)
        const topHunterGroup = await prisma.testMaster.groupBy({
            by: ['collectedByName'],
            where: {
                status: 'COLLECTED',
                campusId: auth.campusId,
                collectedByName: { not: null },
                collectedAt: { gte: firstDayOfMonth },
            },
            _count: { collectedByName: true },
            orderBy: { _count: { collectedByName: 'desc' } },
            take: 1,
        });

        const topHunter = topHunterGroup[0] ? {
            name: topHunterGroup[0].collectedByName,
            count: topHunterGroup[0]._count.collectedByName,
        } : null;

        return NextResponse.json({
            activeMissionsCount,
            collectedThisMonthCount,
            upcomingEventsCount,
            nextEvent,
            topHunter,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}

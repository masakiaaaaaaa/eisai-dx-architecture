import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const studentIdsParam = searchParams.get('studentIds');
    const singleStudentId = searchParams.get('studentId');

    // 1. Auth Check
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    const headers = {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
    };

    if (!authSession || !authSession.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let campusId: number;
    try {
        const sessionData = JSON.parse(authSession.value);
        campusId = parseInt(sessionData.campusId);
        if (isNaN(campusId)) {
            return NextResponse.json({ error: 'Invalid Campus ID' }, { status: 401 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid Session Data' }, { status: 401 });
    }

    const studentNamesParam = searchParams.get('studentNames');

    if (!studentIdsParam && !singleStudentId && !studentNamesParam) {
        return NextResponse.json({ error: 'Student ID(s) or Name(s) required' }, { status: 400 });
    }

    try {
        const studentIds = studentIdsParam
            ? studentIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0)
            : (singleStudentId ? [singleStudentId] : []);

        const studentNames = studentNamesParam
            ? studentNamesParam.split(',').map(name => name.trim()).filter(name => name.length > 0)
            : [];

        if (studentIds.length === 0 && studentNames.length === 0) {
            return NextResponse.json({ data: {} });
        }

        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
            select: { id: true, name: true }
        });

        // 2. Check for Shared Notes & Schedule (Scoped to Campus)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoWeeksLater = new Date(today);
        twoWeeksLater.setDate(today.getDate() + 14);

        // Helper to parse and filter test schedules for a student
        const getTestSchedulesForStudent = (school: any, studentGrade: string, returnAll: boolean = false) => {
            if (!school?.testDates) return [];
            try {
                let testDates = typeof school.testDates === 'string'
                    ? JSON.parse(school.testDates)
                    : school.testDates;

                // Handle double-escaped JSON (stored as escaped string)
                if (typeof testDates === 'string') {
                    testDates = JSON.parse(testDates);
                }

                if (!Array.isArray(testDates)) return [];

                return testDates
                    .filter((test: any) => {
                        if (returnAll) return true; // Include all dates for this school if requested

                        const startDate = new Date(test.start);
                        const endDate = new Date(test.end);

                        // Use notifyWeeksBefore from test settings (default: 4 weeks)
                        const notifyWeeks = test.notifyWeeksBefore || 4;
                        const notifyStartDate = new Date(startDate);
                        notifyStartDate.setDate(startDate.getDate() - (notifyWeeks * 7));

                        // Check if currently in notification period or ongoing
                        const isInNotifyPeriod = today >= notifyStartDate && today <= endDate;
                        const isOngoing = startDate <= today && endDate >= today;

                        // Check if student's grade is in collectGrades (or collectGrades is not specified)
                        const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                        const gradeMatches = targetGrades.includes(studentGrade);
                        return (isInNotifyPeriod || isOngoing) && gradeMatches;
                    })
                    .map((test: any) => ({
                        id: `test-${school.id}-${test.name}`,
                        name: test.name,
                        schoolId: school.id,
                        schoolName: school.name,
                        start: test.start,
                        end: test.end,
                        collectGrades: test.collectGrades || ['中1', '中2', '中3']
                    }));
            } catch (e) {
                return [];
            }
        };

        // 3. Fetch all test collections for the campus to determine what's missing
        const campusTestMasters = await prisma.testMaster.findMany({
            where: { campusId },
            select: { schoolId: true, grade: true, semester: true, subject: true, collectionType: true, year: true }
        });

        const allStudentsInCampus = await prisma.student.findMany({
            where: {
                campusId: campusId,
            },
            select: {
                id: true,
                studentId: true,
                name: true,
                description: true,
                noteUpdatedAt: true,
                createdAt: true,
                updatedAt: true,
                isHighlighted: true,
                isChurnRisk: true,
                churnRiskReason: true,
                grade: true,
                school: {
                    select: {
                        id: true,
                        name: true,
                        testDates: true
                    }
                },
                events: {
                    orderBy: {
                        date: 'asc'
                    },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        date: true,
                        type: true,
                        resolvedAt: true,
                        notifyStart: true,
                        notifyEnd: true
                    }
                },
                announcements: {
                    select: {
                        id: true,
                        title: true,
                        detail: true,
                        importance: true,
                        createdAt: true,
                        notifyStart: true,
                        notifyEnd: true,
                        resolvedAt: true
                    }
                }
            }
        });

        // Helper to normalize names (remove whitespace and suffixes)
        const normalize = (s: string) => s.replace(/\s+/g, '').replace(/[さんくん]$/, '');

        // Normalize query names
        const normalizedQueryNames = studentNames.map(n => normalize(n));

        // Use a persistent map for O(1) lookups during iteration
        const studentByNormalizedName = new Map<string, any>();
        const studentByStudentId = new Map<string, any>();

        allStudentsInCampus.forEach(s => {
            if (s.studentId) studentByStudentId.set(s.studentId, s);
            if (s.name) studentByNormalizedName.set(normalize(s.name), s);
        });

        // Construct response map
        const result: Record<string, any> = {};

        // Helper to find student
        const findStudent = (id?: string, name?: string) => {
            if (id && studentByStudentId.has(id)) return studentByStudentId.get(id);
            if (name) {
                const norm = normalize(name);
                if (studentByNormalizedName.has(norm)) return studentByNormalizedName.get(norm);
            }
            return undefined;
        };
        // Helper to check if item is active (within period)
        const isItemActive = (item: any, type: 'announcement' | 'event') => {
            // 1. Must be unresolved
            if (item.resolvedAt) return false;

            const now = new Date();

            if (type === 'announcement') {
                const start = item.notifyStart ? new Date(item.notifyStart) : null;
                const end = item.notifyEnd ? new Date(item.notifyEnd) : null;
                if (!start && !end) return true;
                if (start && !end) return now >= start;
                if (!start && end) return now <= end;
                return now >= start! && now <= end!;
            } else {
                // Event
                const start = item.notifyStart ? new Date(item.notifyStart) : null;
                const end = item.notifyEnd ? new Date(item.notifyEnd) : null;

                if (start || end) {
                    if (!start && end) return now <= end;
                    if (start && !end) return now >= start;
                    if (start && end) return now >= start && now <= end;
                }

                // Fallback to date >= today (future event)
                const eventDate = new Date(item.date);
                return eventDate >= today;
            }
        };

        // Helper to check if description is within 14 days
        const isDescriptionValid = (student: any) => {
            if (!student?.description || student.description.trim() === '') return false;
            // 2週間前の日付を計算
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            twoWeeksAgo.setHours(0, 0, 0, 0); // 開始時間を0時に設定

            // 特記事項の更新日時(noteUpdatedAt)で判定
            // noteUpdatedAtが未設定（過去の古いデータ）の場合は期限外とみなす
            if (!student.noteUpdatedAt) return false;
            const noteUpdatedAt = new Date(student.noteUpdatedAt);
            return noteUpdatedAt >= twoWeeksAgo;
        };

        // Process IDs
        studentIds.forEach(id => {
            const student = findStudent(id, undefined);

            const hasDesc = isDescriptionValid(student);
            const validDescription = hasDesc ? student.description : null;

            // Return ALL announcements (no date/resolved filter for display)
            const allAnnouncements = student?.announcements || [];

            // Badge only for UNRESOLVED AND ACTIVE items
            const hasAnnounce = allAnnouncements.some((a: any) => isItemActive(a, 'announcement'));

            // Only count unresolved events for markers
            const unresolvedEvents = (student?.events || []).filter((e: any) => !e.resolvedAt);
            const hasActiveEvents = (student?.events || []).some((e: any) => isItemActive(e, 'event'));
            const testSchedules = student ? getTestSchedulesForStudent(student.school, student.grade) : [];

            // Check for missing collections
            let hasCollectionTask = false;
            // Only apply collection tasks if the student's grade is included in collectGrades.
            if (student?.school?.testDates) {
                const currentYear = new Date().getFullYear();

                // We need all tests for this school, but ONLY if the student's grade is included in collectGrades.
                // We cannot use getTestSchedulesForStudent(..., true) because it skips the grade check.
                let rawTestDates = [];
                try {
                    rawTestDates = typeof student.school.testDates === 'string'
                        ? JSON.parse(student.school.testDates)
                        : student.school.testDates;
                    if (typeof rawTestDates === 'string') rawTestDates = JSON.parse(rawTestDates);
                } catch (e) { }

                if (Array.isArray(rawTestDates)) {
                    for (const test of rawTestDates) {
                        // Check if student's grade is in collectGrades (or collectGrades is not specified)
                        const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                        const gradeMatches = targetGrades.includes(student.grade);
                        if (!gradeMatches) continue; // Skip test if student is not in the target grades

                        if (!test.end) continue;
                        const endDate = new Date(test.end);
                        endDate.setHours(23, 59, 59, 999);

                        // 終了日基準で、期日(1ヶ月後)を設定 (collection/page.tsxに合わせる)
                        const deadline = new Date(endDate);
                        deadline.setMonth(deadline.getMonth() + 1);

                        if (today > endDate && today <= deadline) {
                            const isFinal = test.name?.includes('期末') || test.name?.includes('学年末');
                            const requiredSubjects = isFinal
                                ? ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術', '家庭']
                                : ['国語', '数学', '英語', '理科', '社会'];

                            const existingCollectionsForTest = campusTestMasters.filter(c =>
                                c.schoolId === student.school.id &&
                                c.grade === student.grade &&
                                c.semester === test.name &&
                                c.year === currentYear
                            );

                            const allCollected = requiredSubjects.every(subject => {
                                const collection = existingCollectionsForTest.find(c => c.subject === subject);
                                return collection && collection.collectionType === 'BOTH';
                            });

                            if (!allCollected) {
                                hasCollectionTask = true;
                                break;
                            }
                        }
                    }
                }
            }

            // Determine if this is a new/trial student
            // DB未登録 → new | isHighlighted=true かつ createdAtから30日以内 → new（30日超過で自動解除）
            const isNewStudent = !student ||
                (!!student.isHighlighted && (!student.createdAt || (Date.now() - new Date(student.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000));

            result[id] = {
                dbId: student?.id,
                studentId: student?.studentId,
                isNewStudent: !!isNewStudent,
                isChurnRisk: !!student?.isChurnRisk,
                churnRiskReason: student?.churnRiskReason || null,
                hasUnreadLine: false,
                hasSharedNote: hasDesc || hasAnnounce,
                hasEvents: hasActiveEvents,
                hasTestSchedules: testSchedules.length > 0,
                hasCollectionTask,
                sharedNoteContent: validDescription,
                schoolId: student?.school?.id || null,
                schoolName: student?.school?.name || null,
                events: student?.events || [],
                announcements: allAnnouncements.map((a: any) => ({
                    ...a,
                    date: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
                })),
                testSchedules,
                allSchoolTestSchedules: student?.school?.testDates ? getTestSchedulesForStudent(student.school, student.grade, true) : []
            };
        });

        // Process Names (Key is the Name)
        studentNames.forEach(name => {
            const student = findStudent(undefined, name);

            const hasDesc = isDescriptionValid(student);
            const validDescription = hasDesc ? student.description : null;

            // Return ALL announcements
            const allAnnouncements = student?.announcements || [];

            // Badge for UNRESOLVED AND ACTIVE
            const hasAnnounce = allAnnouncements.some((a: any) => isItemActive(a, 'announcement'));

            const unresolvedEvents = (student?.events || []).filter((e: any) => !e.resolvedAt);
            const hasActiveEvents = (student?.events || []).some((e: any) => isItemActive(e, 'event'));
            const testSchedules = student ? getTestSchedulesForStudent(student.school, student.grade) : [];

            // Check for missing collections
            let hasCollectionTask = false;
            // Only apply collection tasks if the student's grade is included in collectGrades.
            if (student?.school?.testDates) {
                const currentYear = new Date().getFullYear();

                let rawTestDates = [];
                try {
                    rawTestDates = typeof student.school.testDates === 'string'
                        ? JSON.parse(student.school.testDates)
                        : student.school.testDates;
                    if (typeof rawTestDates === 'string') rawTestDates = JSON.parse(rawTestDates);
                } catch (e) { }

                if (Array.isArray(rawTestDates)) {
                    for (const test of rawTestDates) {
                        // Check if student's grade is in collectGrades (or collectGrades is not specified)
                        const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                        const gradeMatches = targetGrades.includes(student.grade);
                        if (!gradeMatches) continue; // Skip test if student is not in the target grades

                        if (!test.end) continue;
                        const endDate = new Date(test.end);
                        endDate.setHours(23, 59, 59, 999);

                        const deadline = new Date(endDate);
                        deadline.setMonth(deadline.getMonth() + 1);

                        if (today > endDate && today <= deadline) {
                            const isFinal = test.name?.includes('期末') || test.name?.includes('学年末');
                            const requiredSubjects = isFinal
                                ? ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術', '家庭']
                                : ['国語', '数学', '英語', '理科', '社会'];

                            const existingCollectionsForTest = campusTestMasters.filter(c =>
                                c.schoolId === student.school.id &&
                                c.grade === student.grade &&
                                c.semester === test.name &&
                                c.year === currentYear
                            );

                            const allCollected = requiredSubjects.every(subject => {
                                const collection = existingCollectionsForTest.find(c => c.subject === subject);
                                return collection && collection.collectionType === 'BOTH';
                            });

                            if (!allCollected) {
                                hasCollectionTask = true;
                                break;
                            }
                        }
                    }
                }
            }

            // Determine if this is a new/trial student
            // DB未登録 → new | isHighlighted=true かつ createdAtから30日以内 → new（30日超過で自動解除）
            const isNewStudent = !student ||
                (!!student.isHighlighted && (!student.createdAt || (Date.now() - new Date(student.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000));

            result[name] = {
                dbId: student?.id,
                studentId: student?.studentId,
                isNewStudent: !!isNewStudent,
                isChurnRisk: !!student?.isChurnRisk,
                churnRiskReason: student?.churnRiskReason || null,
                hasUnreadLine: false,
                hasSharedNote: hasDesc || hasAnnounce,
                hasEvents: hasActiveEvents,
                hasTestSchedules: testSchedules.length > 0,
                hasCollectionTask,
                sharedNoteContent: validDescription,
                schoolId: student?.school?.id || null,
                schoolName: student?.school?.name || null,
                events: student?.events || [],
                announcements: allAnnouncements.map((a: any) => ({
                    ...a,
                    date: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
                })),
                testSchedules,
                allSchoolTestSchedules: student?.school?.testDates ? getTestSchedulesForStudent(student.school, student.grade, true) : []
            };
        });

        // Collect all test schedules from all schools in campus
        const allSchools = await prisma.school.findMany({
            where: { campusId },
            select: { id: true, name: true, testDates: true }
        });

        const allTestSchedules: any[] = [];
        allSchools.forEach(school => {
            try {
                if (!school.testDates || school.testDates === '') return;
                let testDates = typeof school.testDates === 'string'
                    ? JSON.parse(school.testDates)
                    : school.testDates;
                if (typeof testDates === 'string') testDates = JSON.parse(testDates);
                if (!Array.isArray(testDates)) return;

                testDates.forEach((test: any) => {
                    allTestSchedules.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        name: test.name,
                        start: test.start,
                        end: test.end,
                        collectGrades: test.collectGrades || ['中1', '中2', '中3']
                    });
                });
            } catch (e) { /* ignore */ }
        });

        return NextResponse.json({
            ...result,
            _allTestSchedules: allTestSchedules,
            _campus: campus ? { id: campus.id, name: campus.name } : null,
            _debug: {
                campusId,
                studentCount: allStudentsInCampus.length,
                normalizedCount: studentByNormalizedName.size,
                sampleName: allStudentsInCampus.length > 0 ? allStudentsInCampus[0].name : '(None)',
                receivedQuery: studentNamesParam || '(null)',
                normalizedQuery: normalizedQueryNames.join(',')
            }
        });

    } catch (error: any) {
        console.error('Extension API Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error?.message || String(error)}` }, { status: 500 });
    }
}

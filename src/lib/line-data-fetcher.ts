import { prisma } from '@/lib/prisma';

export async function fetchWeeklyLineData(campusId: number) {
    const now = new Date();
    // JST date for comparison
    const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const today = new Date(jstNow.getFullYear(), jstNow.getMonth(), jstNow.getDate());

    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(now.getDate() + 14);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    // 1. Uncollected Tests - Generate from school testDates (matching collection page logic)
    const MIDTERM_SUBJECTS = ['国語', '数学', '英語', '理科', '社会'];
    const FINAL_SUBJECTS = ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術', '家庭'];

    const schoolsForMissions = await prisma.school.findMany({
        where: { campusId }
    });

    const existingCollections = await prisma.testMaster.findMany({
        where: { campusId },
        include: { collectedFrom: true }
    });

    // Fetch students for available students in missions (active students only)
    const allStudents = await prisma.student.findMany({
        where: {
            campusId,
            isActive: true,
        },
        select: { id: true, name: true, schoolId: true, grade: true }
    });

    const missions: any[] = [];
    const schoolsNeedingScoreCollection: string[] = [];

    schoolsForMissions.forEach(school => {
        try {
            if (!school.testDates || school.testDates === '') return;
            let testDates = typeof school.testDates === 'string'
                ? JSON.parse(school.testDates)
                : school.testDates;

            // Handle double-escaped JSON (stored as escaped string)
            if (typeof testDates === 'string') {
                testDates = JSON.parse(testDates);
            }

            if (!Array.isArray(testDates)) return;

            testDates.forEach((test: any) => {
                if (test.collectEnabled === false) return;

                // Check if test period has ended
                const endDate = new Date(test.end);
                endDate.setHours(23, 59, 59, 999);
                if (today <= endDate) return; // Period not ended yet

                // Check if deadline (1 month after end) has passed
                const deadline = new Date(endDate);
                deadline.setMonth(deadline.getMonth() + 1);
                if (today > deadline) return; // Already expired

                const isFinal = test.name?.includes('期末');
                const subjectNames = isFinal ? FINAL_SUBJECTS : MIDTERM_SUBJECTS;
                const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                const testYear = new Date(test.start).getFullYear();

                targetGrades.forEach((grade: string) => {
                    // Find uncollected subjects
                    const uncollectedSubjects: string[] = [];
                    let assignedStudent: string | null = null;

                    subjectNames.forEach(subject => {
                        const existing = existingCollections.find((c: any) =>
                            c.schoolId === school.id &&
                            c.grade === grade &&
                            c.semester === test.name &&
                            c.subject === subject &&
                            c.year === testYear
                        );

                        if (existing && existing.collectionType === 'BOTH') {
                            // Already collected
                        } else {
                            uncollectedSubjects.push(subject);
                            if (existing?.collectedFrom?.name) {
                                assignedStudent = existing.collectedFrom.name;
                            }
                        }
                    });

                    if (uncollectedSubjects.length > 0) {
                        // Get available students for this school/grade
                        const availableStudents = allStudents
                            .filter((s: any) => s.schoolId === school.id && s.grade === grade)
                            .map((s: any) => s.name);

                        missions.push({
                            id: `${school.id}-${test.name}-${grade}`,
                            school: { id: school.id, name: school.name },
                            grade,
                            semester: test.name,
                            subjects: uncollectedSubjects,
                            assignedStudent,
                            availableStudents,
                            testEnd: test.end
                        });

                        if (!schoolsNeedingScoreCollection.includes(school.name)) {
                            schoolsNeedingScoreCollection.push(school.name);
                        }
                    }
                });
            });
        } catch (e) {
            // ignore parsing errors
        }
    });

    // 2. Events (DB) - Include events within notify period OR upcoming in 2 weeks
    const dbEvents = await prisma.event.findMany({
        where: {
            campusId,
            studentId: null,
            OR: [
                // Events with notifyStart/notifyEnd in range
                {
                    notifyStart: { lte: now },
                    notifyEnd: { gte: now }
                },
                // Events starting in next 2 weeks (regardless of notify settings)
                {
                    date: { gte: now, lte: twoWeeksLater }
                }
            ]
        },
        orderBy: { date: 'asc' },
    });

    // 3. Test Schedules as Events
    const schools = await prisma.school.findMany({
        where: { campusId }
    });

    const testEvents: any[] = [];
    schools.forEach(school => {
        try {
            if (!school.testDates || school.testDates === '') return;
            const dates = typeof school.testDates === 'string' ? JSON.parse(school.testDates) : school.testDates;

            if (!Array.isArray(dates)) return;

            dates.forEach((d: any) => {
                const startDate = new Date(d.start);
                const endDate = new Date(d.end);

                // Show if start is upcoming in 2 weeks OR if we're within the test period
                const isUpcoming = startDate >= now && startDate <= twoWeeksLater;
                const isOngoing = startDate <= now && endDate >= today;

                if (isUpcoming || isOngoing) {
                    testEvents.push({
                        id: `test-${school.id}-${d.name}`,
                        title: `${school.name} ${d.name}`,
                        date: startDate,
                        endDate: endDate,
                        description: `対象: ${d.collectGrades?.join(',') || '全学年'}`,
                        campusId,
                        studentId: null
                    });
                }
            });
        } catch (e) {
            // ignore parsing errors
        }
    });

    const events = [...dbEvents, ...testEvents]
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10);

    // 4. Announcements
    const announcements = await prisma.announcement.findMany({
        where: {
            campusId,
            studentId: null,
            OR: [
                {
                    notifyStart: { lte: now },
                    notifyEnd: { gte: now },
                },
                {
                    notifyStart: null,
                    createdAt: { gte: oneWeekAgo },
                },
            ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    // 5. Individual Items (Active students only)
    const individualEvents = await prisma.event.findMany({
        where: {
            campusId,
            studentId: { not: null },
            student: { isActive: true },
            notifyStart: { lte: now },
            notifyEnd: { gte: now },
        },
        include: { student: true },
    });

    const individualAnnouncements = await prisma.announcement.findMany({
        where: {
            campusId,
            studentId: { not: null },
            student: { isActive: true },
            notifyStart: { lte: now },
            notifyEnd: { gte: now },
        },
        include: { student: true },
    });

    const individualItems = [
        ...individualEvents.map((e: any) => ({ type: 'event' as const, studentName: e.student?.name || 'Unknown' })),
        ...individualAnnouncements.map((a: any) => ({ type: 'announcement' as const, studentName: a.student?.name || 'Unknown' })),
    ];

    // 6. Individual Test Schedules - students with upcoming tests (active students only)
    const studentsWithSchools = await prisma.student.findMany({
        where: {
            campusId,
            isActive: true,
        },
        select: {
            name: true,
            grade: true,
            school: {
                select: {
                    id: true,
                    name: true,
                    testDates: true
                }
            }
        }
    });

    const individualTestSchedules: {
        studentName: string;
        grade: string;
        testName: string;
        schoolName: string;
        start: string;
        end: string;
    }[] = [];

    studentsWithSchools.forEach(student => {
        if (!student.school?.testDates) return;
        try {
            let testDates = typeof student.school.testDates === 'string'
                ? JSON.parse(student.school.testDates)
                : student.school.testDates;

            // Handle double-escaped JSON (stored as escaped string)
            if (typeof testDates === 'string') {
                testDates = JSON.parse(testDates);
            }

            if (!Array.isArray(testDates)) return;

            testDates.forEach((test: any) => {
                const startDate = new Date(test.start);
                const endDate = new Date(test.end);

                // Use notifyWeeksBefore from test settings (default: 4 weeks)
                const notifyWeeks = test.notifyWeeksBefore || 4;
                const notifyStartDate = new Date(startDate);
                notifyStartDate.setDate(startDate.getDate() - (notifyWeeks * 7));

                // Check if currently in notification period or ongoing
                const isInNotifyPeriod = today >= notifyStartDate && today <= endDate;
                const isOngoing = startDate <= today && endDate >= today;

                // Determine target grades:
                // If test.collectGrades has elements, use it. Otherwise, default by school type.
                let targetGrades: string[] = [];
                if (Array.isArray(test.collectGrades) && test.collectGrades.length > 0) {
                    targetGrades = test.collectGrades;
                } else {
                    const schoolName = student.school?.name || '';
                    if (schoolName.includes('高')) {
                        targetGrades = ['高1', '高2', '高3'];
                    } else if (schoolName.includes('中')) {
                        targetGrades = ['中1', '中2', '中3'];
                    } else if (schoolName.includes('小')) {
                        targetGrades = ['小1', '小2', '小3', '小4', '小5', '小6'];
                    } else {
                        targetGrades = ['中1', '中2', '中3', '高1', '高2', '高3'];
                    }
                }
                const gradeMatches = targetGrades.includes(student.grade);

                if ((isInNotifyPeriod || isOngoing) && gradeMatches) {
                    individualTestSchedules.push({
                        studentName: student.name,
                        grade: student.grade,
                        testName: test.name,
                        schoolName: student.school!.name,
                        start: test.start,
                        end: test.end
                    });
                }
            });
        } catch (e) {
            // ignore parsing errors
        }
    });

    // Fetch passcode
    const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        select: { passcode: true }
    });

    return {
        missions,
        events,
        announcements,
        individualItems,
        individualTestSchedules,
        schoolsNeedingScoreCollection,
        passcode: campus?.passcode,
        campusId
    };
}


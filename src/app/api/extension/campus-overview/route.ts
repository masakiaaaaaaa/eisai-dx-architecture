import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

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

    try {
        // 1. Global Announcements (not tied to a specific student)
        const globalAnnouncements = await prisma.announcement.findMany({
            where: {
                campusId,
                studentId: null
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
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
        });

        // 2. Global Events (not tied to a specific student)
        const globalEvents = await prisma.event.findMany({
            where: {
                campusId,
                studentId: null
            },
            orderBy: { date: 'asc' },
            take: 20,
            select: {
                id: true,
                title: true,
                date: true,
                endDate: true,
                type: true,
                description: true,
                resolvedAt: true,
                notifyStart: true,
                notifyEnd: true
            }
        });

        // 3. All registered student names in campus (for CSV mismatch detection)
        const registeredStudents = await prisma.student.findMany({
            where: {
                campusId,
                isActive: true
            },
            select: {
                name: true,
                studentId: true
            }
        });

        // Normalize names for comparison
        const registeredNames = registeredStudents.map(s => ({
            name: s.name,
            normalized: s.name.replace(/\s+/g, '').replace(/[さんくん]$/, '')
        }));

        // 4. All test schedules from all schools in campus
        const schools = await prisma.school.findMany({
            where: { campusId },
            select: { id: true, name: true, testDates: true }
        });

        const allTestSchedules: any[] = [];
        schools.forEach(school => {
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

        // 5. Get campus name
        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
            select: { name: true }
        });

        return NextResponse.json({
            campusName: campus?.name || '不明な校舎',
            globalAnnouncements: globalAnnouncements.map(a => ({
                ...a,
                createdAt: a.createdAt?.toISOString(),
                notifyStart: a.notifyStart?.toISOString(),
                notifyEnd: a.notifyEnd?.toISOString(),
                resolvedAt: a.resolvedAt?.toISOString() || null
            })),
            globalEvents: globalEvents.map(e => ({
                ...e,
                date: e.date?.toISOString(),
                endDate: e.endDate?.toISOString() || null,
                notifyStart: e.notifyStart?.toISOString() || null,
                notifyEnd: e.notifyEnd?.toISOString() || null,
                resolvedAt: e.resolvedAt?.toISOString() || null
            })),
            registeredNames,
            allTestSchedules
        });

    } catch (error: any) {
        console.error('Campus Overview Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error?.message}` }, { status: 500 });
    }
}

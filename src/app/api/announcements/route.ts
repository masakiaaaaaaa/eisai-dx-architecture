import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Helper function to get authenticated campus ID
async function getAuthenticatedCampusId(): Promise<number | null> {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) return null;

    try {
        const sessionData = JSON.parse(authSession.value);
        const campusId = parseInt(sessionData.campusId);
        return isNaN(campusId) ? null : campusId;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    // Authentication check
    const authenticatedCampusId = await getAuthenticatedCampusId();
    if (!authenticatedCampusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    // Verify user can only access their own campus data
    if (!campusId || parseInt(campusId) !== authenticatedCampusId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const scope = searchParams.get('scope');
    const active = searchParams.get('active');

    try {
        const whereClause: any = {
            campusId: authenticatedCampusId,
        };

        if (scope !== 'all') {
            whereClause.studentId = null;
        }

        if (active === 'true') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            whereClause.OR = [
                { notifyEnd: { gte: now } },
                { notifyEnd: null }
            ];
        }

        const announcements = await prisma.announcement.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { student: true }
        });
        return NextResponse.json(announcements);
    } catch (error) {
        console.error('Failed to fetch announcements:', error);
        return NextResponse.json({ error: 'Failed to fetch announcements', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Authentication check
    const authenticatedCampusId = await getAuthenticatedCampusId();
    if (!authenticatedCampusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { campusId, title, detail, importance, notifyStart, notifyEnd, studentId } = body;

        // Verify user can only create announcements for their own campus
        if (Number(campusId) !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                campusId: authenticatedCampusId,
                title,
                detail,
                importance,
                notifyStart: notifyStart ? new Date(notifyStart) : null,
                notifyEnd: notifyEnd ? new Date(notifyEnd) : null,
                studentId: studentId ? Number(studentId) : null,
            },
        });
        return NextResponse.json(announcement);
    } catch (error) {
        console.error('Failed to create announcement:', error);
        return NextResponse.json({
            error: 'Failed to create announcement',
            details: (error as Error).message
        }, { status: 500 });
    }
}

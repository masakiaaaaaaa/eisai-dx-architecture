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

    try {
        const whereClause: any = {
            campusId: authenticatedCampusId,
        };

        if (scope !== 'all') {
            whereClause.studentId = null;
        }

        const events = await prisma.event.findMany({
            where: whereClause,
            orderBy: { date: 'asc' },
            include: { student: true }
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return NextResponse.json({ error: 'Failed to fetch events', details: String(error) }, { status: 500 });
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
        const { campusId, title, date, endDate, type, description, notifyStart, notifyEnd, studentId } = body;

        // Verify user can only create events for their own campus
        if (Number(campusId) !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const event = await prisma.event.create({
            data: {
                campusId: authenticatedCampusId,
                title,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : null,
                type,
                description,
                notifyStart: notifyStart ? new Date(notifyStart) : null,
                notifyEnd: notifyEnd ? new Date(notifyEnd) : null,
                studentId: studentId ? Number(studentId) : null,
            },
        });
        return NextResponse.json(event);
    } catch (error) {
        console.error('Failed to create event:', error);
        return NextResponse.json({
            error: 'Failed to create event',
            details: (error as Error).message,
        }, { status: 500 });
    }
}

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

    try {
        const schools = await prisma.school.findMany({
            where: {
                campusId: authenticatedCampusId,
            },
            include: {
                _count: {
                    select: { students: true },
                },
            },
        });
        return NextResponse.json(schools);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
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
        const { campusId, name, testDates } = body;

        // Verify user can only create schools for their own campus
        if (parseInt(campusId) !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const school = await prisma.school.create({
            data: {
                campusId: authenticatedCampusId,
                name,
                testDates: testDates || {},
            },
        });
        return NextResponse.json(school);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    // Authentication check
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let authenticatedCampusId: number;
    try {
        const sessionData = JSON.parse(authSession.value);
        authenticatedCampusId = parseInt(sessionData.campusId);
        if (isNaN(authenticatedCampusId)) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');
    const schoolId = searchParams.get('schoolId');

    // Verify user can only access their own campus data
    if (!campusId || parseInt(campusId) !== authenticatedCampusId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const whereClause: any = {
        campusId: authenticatedCampusId,
    };

    if (schoolId) {
        whereClause.schoolId = parseInt(schoolId);
    }

    try {
        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                school: true,
            },
            orderBy: {
                studentId: 'asc',
            }
        });
        return NextResponse.json(students);
    } catch (error) {
        console.error('Failed to fetch students:', error);
        return NextResponse.json({ error: 'Failed to fetch students', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Authentication check
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let authenticatedCampusId: number;
    try {
        const sessionData = JSON.parse(authSession.value);
        authenticatedCampusId = parseInt(sessionData.campusId);
        if (isNaN(authenticatedCampusId)) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId, name, furigana, schoolId, grade, description } = body;

        const student = await prisma.student.create({
            data: {
                campusId: authenticatedCampusId,
                studentId,
                name,
                furigana,
                schoolId: parseInt(schoolId),
                grade,
                description,
                isHighlighted: true, // Manual add = new enrollment highlight by default
            },
        });
        return NextResponse.json(student);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }
}

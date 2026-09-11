
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Helper for session validation
async function getCampusId() {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) {
        return null;
    }

    try {
        const sessionData = JSON.parse(authSession.value);
        return parseInt(sessionData.campusId);
    } catch (e) {
        return null;
    }
}

export async function POST(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId, title, date, type } = body;

        if (!title || !date) {
            return NextResponse.json({ error: 'Missing required title or date' }, { status: 400 });
        }

        let dbStudentId: number | null = null;

        if (studentId) {
            // 2. Resolve Student ID (String) to Student DB ID (Int)
            const student = await prisma.student.findFirst({
                where: {
                    studentId: studentId, // The string ID from Jukmane
                    campusId: campusId
                }
            });

            if (!student) {
                return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            }
            dbStudentId = student.id;
        }

        // 3. Create Event
        const newEvent = await prisma.event.create({
            data: {
                campusId: campusId,
                studentId: dbStudentId, // Will be null for Global Events
                title: title,
                date: new Date(date),
                endDate: body.endDate ? new Date(body.endDate) : null,
                type: type || 'EVENT',
                description: body.description || '',
                notifyStart: body.notifyStart ? new Date(body.notifyStart) : null,
                notifyEnd: body.notifyEnd ? new Date(body.notifyEnd) : null,
            }
        });

        return NextResponse.json(newEvent);

    } catch (error: any) {
        console.error('Create Event Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error?.message || String(error)}` }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, title, ...rest } = body;

        if (!id) {
            return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
        }

        // Verify Ownership
        const existing = await prisma.event.findFirst({
            where: { id: parseInt(id), campusId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
        }

        const updated = await prisma.event.update({
            where: { id: parseInt(id) },
            data: {
                title: title,
                date: rest.date ? new Date(rest.date) : undefined,
                endDate: rest.endDate ? new Date(rest.endDate) : undefined,
                type: rest.type,
                description: rest.description,
                notifyStart: rest.notifyStart ? new Date(rest.notifyStart) : undefined,
                notifyEnd: rest.notifyEnd ? new Date(rest.notifyEnd) : undefined,
            }
        });

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error('Update Event Error:', error);
        return NextResponse.json({ error: `Internal Server Error` }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    try {
        const existing = await prisma.event.findFirst({
            where: { id: parseInt(id), campusId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
        }

        await prisma.event.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Event Error:', error);
        return NextResponse.json({ error: `Internal Server Error` }, { status: 500 });
    }
}

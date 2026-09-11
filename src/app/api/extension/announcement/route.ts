
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
        const { studentId, title, detail, importance, notifyStart, notifyEnd } = body;

        if (!title || !detail) {
            return NextResponse.json({ error: 'Missing required title or detail' }, { status: 400 });
        }

        let dbStudentId: number | null = null;

        if (studentId) {
            // 1. Find Student by String ID (e.g., "S123") + Campus
            const student = await prisma.student.findFirst({
                where: {
                    studentId: studentId,
                    campusId: campusId
                }
            });

            if (!student) {
                return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            }
            dbStudentId = student.id;
        }

        // 2. Create Announcement
        const newAnnouncement = await prisma.announcement.create({
            data: {
                campusId: campusId,
                studentId: dbStudentId, // Will be null for Global Announcements
                title: title,
                detail: detail,
                importance: importance || 'MEDIUM',
                notifyStart: notifyStart ? new Date(notifyStart) : null,
                notifyEnd: notifyEnd ? new Date(notifyEnd) : null,
            }
        });

        return NextResponse.json(newAnnouncement);

    } catch (error: any) {
        console.error('Extension Announcement Create Error:', error);
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
            return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
        }

        // Verify Ownership
        const existing = await prisma.announcement.findFirst({
            where: { id: parseInt(id), campusId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Announcement not found or unauthorized' }, { status: 404 });
        }

        const updated = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: {
                title: title,
                detail: rest.detail,
                importance: rest.importance,
                notifyStart: rest.notifyStart ? new Date(rest.notifyStart) : undefined,
                notifyEnd: rest.notifyEnd ? new Date(rest.notifyEnd) : undefined,
            }
        });

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error('Update Announcement Error:', error);
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
        return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    try {
        const existing = await prisma.announcement.findFirst({
            where: { id: parseInt(id), campusId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Announcement not found or unauthorized' }, { status: 404 });
        }

        await prisma.announcement.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Announcement Error:', error);
        return NextResponse.json({ error: `Internal Server Error` }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const announcements = await prisma.announcement.findMany({
            where: {
                studentId: parseInt(id),
            },
            orderBy: [
                { resolvedAt: { sort: 'asc', nulls: 'first' } },
                { createdAt: 'desc' },
            ],
        });
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { title, detail, importance, notifyStart, notifyEnd, notifyTimes } = body;

        // Calculate dates
        const now = new Date();
        let finalNotifyStart = now;
        let finalNotifyEnd = null;

        if (notifyStart) {
            finalNotifyStart = new Date(notifyStart);
        }
        if (notifyEnd) {
            finalNotifyEnd = new Date(notifyEnd);
        } else if (notifyTimes) {
            finalNotifyEnd = new Date(now);
            finalNotifyEnd.setDate(now.getDate() + (parseInt(notifyTimes) * 7));
        }

        const announcement = await prisma.announcement.create({
            data: {
                campusId: 1, // TODO: Get from session
                studentId: parseInt(id),
                title,
                detail,
                importance,
                notifyStart: finalNotifyStart,
                notifyEnd: finalNotifyEnd,
            },
        });
        return NextResponse.json(announcement);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

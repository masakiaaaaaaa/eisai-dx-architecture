import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    if (!campusId) {
        return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
    }

    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Include events from the start of today
        const todayStr = now.toISOString().split('T')[0];

        // Fetch active events (future events)
        const events = await prisma.event.findMany({
            where: {
                campusId: parseInt(campusId),
                date: {
                    gte: now,
                },
            },
            include: {
                student: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Fetch active announcements (within notification period)
        // If notifyEnd is not set, assume it's valid for a reasonable time or handle differently.
        // Here we assume notifyEnd is required as per recent changes.
        const announcements = await prisma.announcement.findMany({
            where: {
                campusId: parseInt(campusId),
                notifyEnd: {
                    gte: now,
                },
            },
            include: {
                student: true,
            },
            orderBy: {
                notifyEnd: 'asc',
            },
        });

        return NextResponse.json({ events, announcements });
    } catch (error) {
        console.error('Failed to fetch active items:', error);
        return NextResponse.json({ error: 'Failed to fetch active items' }, { status: 500 });
    }
}

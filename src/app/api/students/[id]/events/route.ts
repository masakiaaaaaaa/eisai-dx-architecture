import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const events = await prisma.event.findMany({
            where: {
                studentId: parseInt(id),
            },
            orderBy: [
                { resolvedAt: { sort: 'asc', nulls: 'first' } },
                { date: 'asc' },
            ],
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { title, date, endDate, type, description, notifyWeeksBefore } = body;

        const eventDate = new Date(date);
        let notifyStart = null;

        if (notifyWeeksBefore) {
            notifyStart = new Date(eventDate);
            notifyStart.setDate(eventDate.getDate() - (parseInt(notifyWeeksBefore) * 7));
        }

        // Use endDate if provided, otherwise use event date for notifyEnd
        const notifyEndDate = endDate ? new Date(endDate) : eventDate;

        const event = await prisma.event.create({
            data: {
                campusId: 1, // TODO: Get from session or context
                studentId: parseInt(id),
                title,
                date: eventDate,
                endDate: endDate ? new Date(endDate) : null,
                type,
                description,
                notifyStart,
                notifyEnd: notifyEndDate,
            },
        });
        return NextResponse.json(event);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

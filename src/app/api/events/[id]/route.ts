import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { title, date, endDate, type, description, notifyStart, notifyEnd } = body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : null,
                type,
                description,
                notifyStart: notifyStart ? new Date(notifyStart) : null,
                notifyEnd: notifyEnd ? new Date(notifyEnd) : null,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error('Failed to update event:', error);
        return NextResponse.json(
            { error: 'Failed to update event' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { resolved } = body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                resolvedAt: resolved ? new Date() : null,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error('Failed to update event resolved status:', error);
        return NextResponse.json(
            { error: 'Failed to update event' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.event.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete event:', error);
        return NextResponse.json(
            { error: 'Failed to delete event' },
            { status: 500 }
        );
    }
}

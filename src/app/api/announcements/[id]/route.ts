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
        const { title, detail, importance, notifyStart, notifyEnd } = body;

        const announcement = await prisma.announcement.update({
            where: { id },
            data: {
                title,
                detail,
                importance,
                notifyStart: notifyStart ? new Date(notifyStart) : null,
                notifyEnd: notifyEnd ? new Date(notifyEnd) : null,
            },
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error('Failed to update announcement:', error);
        return NextResponse.json(
            { error: 'Failed to update announcement' },
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

        const announcement = await prisma.announcement.update({
            where: { id },
            data: {
                resolvedAt: resolved ? new Date() : null,
            },
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error('Failed to update announcement resolved status:', error);
        return NextResponse.json(
            { error: 'Failed to update announcement' },
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

        await prisma.announcement.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete announcement:', error);
        return NextResponse.json(
            { error: 'Failed to delete announcement' },
            { status: 500 }
        );
    }
}

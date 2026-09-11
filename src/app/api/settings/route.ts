import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    if (!campusId) {
        return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
    }

    try {
        const campus = await prisma.campus.findUnique({
            where: { id: parseInt(campusId) },
            select: {
                notifyFrequency: true,
                notifyDayOfWeek: true,
                notifyTime: true,
                notifyTargets: true,
            },
        });

        if (!campus) {
            return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
        }

        return NextResponse.json(campus);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campusId, notifyFrequency, notifyDayOfWeek, notifyTime, notifyTargets } = body;

        if (!campusId) {
            return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
        }

        const campus = await prisma.campus.update({
            where: { id: parseInt(campusId) },
            data: {
                notifyFrequency,
                notifyDayOfWeek,
                notifyTime,
                notifyTargets,
            },
        });

        return NextResponse.json(campus);
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

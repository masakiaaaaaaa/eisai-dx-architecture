import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const campuses = await prisma.campus.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });
        return NextResponse.json(campuses);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch campuses',
            details: error?.message || String(error),
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, passcode, lineAccessToken, lineChannelSecret } = body;

        if (!name || !passcode) {
            return NextResponse.json({ error: 'Name and passcode are required' }, { status: 400 });
        }

        // Generate unique slug
        const slug = `campus_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

        const campus = await prisma.campus.create({
            data: {
                name,
                passcode,
                slug,
                lineAccessToken: lineAccessToken || null,
                lineChannelSecret: lineChannelSecret || null,
                // Set defaults
                notifyFrequency: '1',
                notifyDayOfWeek: '1',
                notifyTime: '12:00',
                notifyTargets: 'EVENTS,TESTS,ANNOUNCEMENTS'
            }
        });

        return NextResponse.json(campus);
    } catch (error: any) {
        console.error('Create Campus Error:', error);
        return NextResponse.json({
            error: 'Failed to create campus',
            details: error?.message || String(error),
        }, { status: 500 });
    }
}

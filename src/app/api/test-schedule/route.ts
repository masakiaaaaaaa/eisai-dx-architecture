import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    if (!campusId) {
        return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
    }

    try {
        const schools = await prisma.school.findMany({
            where: {
                campusId: parseInt(campusId),
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(schools);
    } catch (error) {
        console.error('Failed to fetch test schedules', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, testDates } = body;

        if (!id || !testDates) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedSchool = await prisma.school.update({
            where: { id },
            data: {
                testDates: JSON.stringify(testDates),
            },
        });

        return NextResponse.json(updatedSchool);
    } catch (error) {
        console.error('Failed to update test schedule', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

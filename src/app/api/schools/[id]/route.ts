import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { testDates } = body;

        const school = await prisma.school.update({
            where: { id },
            data: {
                testDates,
            },
        });

        return NextResponse.json(school);
    } catch (error) {
        console.error('Failed to update school:', error);
        return NextResponse.json(
            { error: 'Failed to update school' },
            { status: 500 }
        );
    }
}

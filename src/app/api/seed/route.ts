import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    // SECURITY: Disable in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
    }

    try {
        // 1. Campus (Passcode: 0000)
        const campus = await prisma.campus.upsert({
            where: { slug: 'shibuya' },
            update: {
                // @ts-ignore
                passcode: '0000'
            },
            create: {
                name: '渋谷校',
                slug: 'shibuya',
                // @ts-ignore
                passcode: '0000',
            },
        });

        // 2. School
        const school = await prisma.school.create({
            data: {
                campusId: campus.id,
                name: '渋谷高校',
                testDates: JSON.stringify([
                    { id: '1', name: '1学期中間', start: '2025-05-20', end: '2025-05-25' },
                    { id: '2', name: '1学期期末', start: '2025-07-01', end: '2025-07-05' }
                ])
            }
        });

        return NextResponse.json({ success: true, campus, school });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
    }
}

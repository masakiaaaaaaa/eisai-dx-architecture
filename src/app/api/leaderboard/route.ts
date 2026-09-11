import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const campusId = searchParams.get('campusId');

        // Group by collectedByName and count
        // Prisma doesn't support groupBy with relation filtering easily in the same query in some versions,
        // but here we just need to group by the string column.
        // We filter by status: COLLECTED and collectedByName is not null.

        const groupByArgs: any = {
            by: ['collectedByName'],
            where: {
                status: 'COLLECTED',
                collectedByName: {
                    not: null,
                },
            },
            _count: {
                collectedByName: true,
            },
            orderBy: {
                _count: {
                    collectedByName: 'desc',
                },
            },
            take: 5, // Top 5
        };

        if (campusId) {
            groupByArgs.where.campusId = parseInt(campusId);
        }

        const results = await prisma.testMaster.groupBy(groupByArgs);

        // Format for frontend: { name: string, count: number }
        const leaderboard = results.map((item: any) => ({
            name: item.collectedByName,
            count: item._count.collectedByName,
        }));

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

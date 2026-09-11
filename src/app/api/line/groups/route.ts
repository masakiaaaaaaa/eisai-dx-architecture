import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLineClient } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const campusId = url.searchParams.get('campusId');

        const where = campusId ? { campusId: Number(campusId) } : {};

        const groups = await prisma.lineGroup.findMany({
            where,
            include: { campus: true },
            orderBy: { createdAt: 'asc' }
        });

        // Fetch real group names from LINE API (using campus-specific token)
        const groupsWithNames = await Promise.all(groups.map(async (g, index) => {
            let displayName = `グループ ${index + 1}`;
            let isValid = true;

            try {
                const campusClient = await getLineClient(g.campusId);
                const summary = await campusClient.getGroupSummary(g.groupId);
                displayName = summary.groupName || displayName;
            } catch (error: any) {
                // Group may have been deleted or bot was removed
                console.warn(`Failed to get group name for ${g.groupId}:`, error.message);
                displayName = `(無効) グループ ${index + 1}`;
                isValid = false;
            }

            return {
                id: g.id,
                groupId: g.groupId,
                campusId: g.campusId,
                campusName: g.campus.name,
                createdAt: g.createdAt,
                displayName,
                isValid,
            };
        }));

        return NextResponse.json({ groups: groupsWithNames });
    } catch (error: any) {
        console.error('Error fetching LINE groups:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const groupId = url.searchParams.get('id');

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
        }

        await prisma.lineGroup.delete({
            where: { id: Number(groupId) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting LINE group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

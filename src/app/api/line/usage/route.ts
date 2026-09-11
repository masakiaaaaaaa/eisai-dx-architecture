import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const campusId = parseInt(searchParams.get('campusId') || '0');

    let accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (campusId) {
        const campus = await prisma.campus.findUnique({
            where: { id: campusId }
        });
        if (campus?.lineAccessToken) {
            accessToken = campus.lineAccessToken;
        }
    }

    if (!accessToken) {
        return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not set' }, { status: 500 });
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
    };

    try {
        const [quotaRes, consumptionRes] = await Promise.all([
            fetch('https://api.line.me/v2/bot/message/quota', { headers }),
            fetch('https://api.line.me/v2/bot/message/quota/consumption', { headers })
        ]);

        if (!quotaRes.ok || !consumptionRes.ok) {
            const errorText = await quotaRes.text() + ' / ' + await consumptionRes.text();
            throw new Error(`LINE API Error: ${errorText}`);
        }

        const quota = await quotaRes.json();
        const consumption = await consumptionRes.json();

        return NextResponse.json({
            quota,
            consumption
        });

    } catch (error) {
        console.error('Failed to fetch LINE usage:', error);
        return NextResponse.json({
            error: 'Failed to fetch LINE usage',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

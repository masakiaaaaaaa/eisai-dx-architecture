import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST: 拡張機能から講師リストを受け取り、DBに自動登録（upsert）
export async function POST(request: Request) {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let campusId: number;
    try {
        const sessionData = JSON.parse(authSession.value);
        campusId = parseInt(sessionData.campusId);
        if (isNaN(campusId)) {
            return NextResponse.json({ error: 'Invalid Campus ID' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid Session Data' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { lecturers } = body;

        if (!Array.isArray(lecturers) || lecturers.length === 0) {
            return NextResponse.json({ error: 'lecturers array required' }, { status: 400 });
        }

        let synced = 0;
        for (const lec of lecturers) {
            const { fabocKoushiId, name } = lec;
            if (!fabocKoushiId || !name) continue;

            // Upsert: create if not exists, update name if changed
            await prisma.lecturer.upsert({
                where: {
                    campusId_fabocKoushiId: { campusId, fabocKoushiId }
                },
                update: {
                    name: name.trim(),
                    isActive: true,
                },
                create: {
                    campusId,
                    fabocKoushiId,
                    name: name.trim(),
                    isActive: true,
                }
            });
            synced++;
        }

        return NextResponse.json({ success: true, synced });
    } catch (error: any) {
        console.error('Sync lecturers error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

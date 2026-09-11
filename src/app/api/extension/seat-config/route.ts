import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET: 座番設定と講師一覧を取得
export async function GET() {
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
        // Get or create seat config
        let seatConfig = await prisma.seatConfig.findUnique({
            where: { campusId }
        });

        if (!seatConfig) {
            seatConfig = await prisma.seatConfig.create({
                data: {
                    campusId,
                    availableSeats: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13]),
                    defaultOrder: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13])
                }
            });
        }

        // Get lecturers with seat preferences
        const lecturers = await prisma.lecturer.findMany({
            where: { campusId, isActive: true },
            select: {
                id: true,
                name: true,
                fabocKoushiId: true,
                seatPreferences: true,
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            seatConfig: {
                availableSeats: JSON.parse(seatConfig.availableSeats),
                defaultOrder: JSON.parse(seatConfig.defaultOrder),
            },
            lecturers: lecturers.map(l => ({
                id: l.id,
                name: l.name,
                fabocKoushiId: l.fabocKoushiId,
                seatPreferences: l.seatPreferences ? JSON.parse(l.seatPreferences) : [],
            }))
        });
    } catch (error: any) {
        console.error('Seat config API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 講師の優先座番を更新
export async function PUT(request: Request) {
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
        const { lecturerId, seatPreferences } = body;

        if (lecturerId && Array.isArray(seatPreferences)) {
            await prisma.lecturer.update({
                where: { id: lecturerId },
                data: { seatPreferences: JSON.stringify(seatPreferences) }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error: any) {
        console.error('Seat config update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 講師を削除
export async function DELETE(request: Request) {
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
        const url = new URL(request.url);
        const lecturerId = parseInt(url.searchParams.get('lecturerId') || '');

        if (!lecturerId || isNaN(lecturerId)) {
            return NextResponse.json({ error: 'Invalid lecturer ID' }, { status: 400 });
        }

        // 削除する講師がこの校舎のものか確認
        const lecturer = await prisma.lecturer.findUnique({
            where: { id: lecturerId }
        });

        if (!lecturer || lecturer.campusId !== campusId) {
            return NextResponse.json({ error: 'Lecturer not found or unauthorized' }, { status: 404 });
        }

        await prisma.lecturer.delete({
            where: { id: lecturerId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Seat config delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: デフォルト座席順序を更新
export async function PATCH(request: Request) {
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
        const { defaultOrder } = body;

        if (!Array.isArray(defaultOrder) || defaultOrder.length === 0) {
            return NextResponse.json({ error: 'Invalid defaultOrder' }, { status: 400 });
        }

        await prisma.seatConfig.upsert({
            where: { campusId },
            update: {
                defaultOrder: JSON.stringify(defaultOrder)
            },
            create: {
                campusId,
                availableSeats: JSON.stringify(defaultOrder),
                defaultOrder: JSON.stringify(defaultOrder)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Seat config PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

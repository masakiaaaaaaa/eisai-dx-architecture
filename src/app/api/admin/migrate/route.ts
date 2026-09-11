import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST: Run missing table migrations via raw SQL
export async function POST() {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let role: string;
    try {
        const sessionData = JSON.parse(authSession.value);
        role = sessionData.role;
    } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const results: string[] = [];

    try {
        // Create Lecturer table if not exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Lecturer" (
                "id" SERIAL PRIMARY KEY,
                "campusId" INTEGER NOT NULL,
                "lineUserId" TEXT,
                "name" TEXT NOT NULL,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "fabocKoushiId" TEXT,
                "seatPreferences" TEXT,
                CONSTRAINT "Lecturer_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        results.push('Lecturer table: OK');

        // Create unique constraints if not exist
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "Lecturer_lineUserId_key" ON "Lecturer"("lineUserId")
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "Lecturer_campusId_fabocKoushiId_key" ON "Lecturer"("campusId", "fabocKoushiId")
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "Lecturer_campusId_idx" ON "Lecturer"("campusId")
        `);
        results.push('Lecturer indexes: OK');

        // Create SeatConfig table if not exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "SeatConfig" (
                "id" SERIAL PRIMARY KEY,
                "campusId" INTEGER NOT NULL UNIQUE,
                "availableSeats" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7,8,9,10,11,12,13]',
                "defaultOrder" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7,8,9,10,11,12,13]',
                CONSTRAINT "SeatConfig_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "noteUpdatedAt" TIMESTAMP(3);
        `);
        results.push('Student.noteUpdatedAt: OK');

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
}

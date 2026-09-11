import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== 'eisai_migration_force') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    try {
        console.log('Executing direct SQL migration via Prisma Client...');

        // Add Campus columns (from previous migration)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Campus" ADD COLUMN IF NOT EXISTS "lineAccessToken" TEXT;
        `);
        results.push('Campus.lineAccessToken: OK');

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Campus" ADD COLUMN IF NOT EXISTS "lineChannelSecret" TEXT;
        `);
        results.push('Campus.lineChannelSecret: OK');

        // Add Student.createdAt column (for new student detection feature)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        `);
        results.push('Student.createdAt: OK');

        // Add Student.updatedAt column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        `);
        results.push('Student.updatedAt: OK');

        // Add Student.isActive column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
        `);
        results.push('Student.isActive: OK');

        // Add Student.graduatedAt column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "graduatedAt" TIMESTAMP(3);
        `);
        results.push('Student.graduatedAt: OK');

        // Add Student.isHighlighted column (manual new student flag)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isHighlighted" BOOLEAN DEFAULT false;
        `);
        results.push('Student.isHighlighted: OK');

        // Add Student.noteUpdatedAt column (timestamp when description was updated)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "noteUpdatedAt" TIMESTAMP(3);
        `);
        results.push('Student.noteUpdatedAt: OK');

        console.log('Migration SQL executed successfully');

        return NextResponse.json({
            success: true,
            message: 'Schema successfully updated via direct SQL.',
            results,
        });
    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            results,
        }, { status: 500 });
    }
}

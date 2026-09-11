import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');
    const status = searchParams.get('status');

    if (!campusId) {
        return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
    }

    const whereClause: any = {
        campusId: parseInt(campusId),
    };

    if (status) {
        whereClause.status = status;
    }

    try {
        const tests = await prisma.testMaster.findMany({
            where: whereClause,
            include: {
                school: true,
                collectedFrom: true,
            },
            orderBy: {
                collectedAt: 'desc',
            },
        });

        // Filter: Only show PENDING tasks if the test period has completely ended
        const now = new Date();
        // Set time to 00:00:00 for strict date comparison (ignoring time)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const filteredTests = tests.filter((test: any) => {
            // Already collected tests are always shown
            if (test.status !== 'PENDING') return true;

            // If missing school data or testDates is empty, fall back to "show" (safe default)
            if (!test.school || !test.school.testDates) return true;
            if (test.school.testDates === '') return true; // Empty check

            try {
                // Parse testDates JSON
                const testDates = typeof test.school.testDates === 'string'
                    ? JSON.parse(test.school.testDates)
                    : test.school.testDates; // Just in case it's already an object (though Prisma types say string)

                if (!Array.isArray(testDates)) return true;

                // Find matching test date by name (semester field stores the test name like '1学期中間')
                const targetDate = testDates.find((d: any) => d.name === test.semester);

                // If no matching test schedule found, show it (safe default)
                if (!targetDate || !targetDate.end) return true;

                const endDate = new Date(targetDate.end);
                // Reset time to 00:00:00 for comparison
                const testEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                // Show only if today is AFTER the end date (today > testEndDate)
                // Example: End date 12/9. Today 12/9 -> 12/9 > 12/9 is false (Hidden)
                // Example: End date 12/9. Today 12/10 -> 12/10 > 12/9 is true (Shown)
                return today > testEndDate;

            } catch (e) {
                console.error('Error filtering test master:', e);
                return true; // Show on error
            }
        });

        return NextResponse.json(filteredTests);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch test masters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            campusId,
            schoolId,
            grade,
            year,
            semester,
            subject,
            collectionType,
            collectedByName,
            collectedFromId,
        } = body;

        // Check if duplicate exists
        const existing = await prisma.testMaster.findFirst({
            where: {
                campusId: parseInt(campusId),
                schoolId: parseInt(schoolId),
                grade,
                year: parseInt(year),
                semester,
                subject,
            },
        });

        if (existing) {
            // If collectionType is NONE, delete the record (revert to uncollected)
            if (collectionType === 'NONE') {
                await prisma.testMaster.delete({
                    where: { id: existing.id },
                });
                return NextResponse.json({ deleted: true, id: existing.id });
            }

            // If already exists, just update status and collector
            const updated = await prisma.testMaster.update({
                where: { id: existing.id },
                data: {
                    status: 'COLLECTED',
                    collectionType: collectionType || 'BOTH',
                    collectedByName,
                    collectedFromId: collectedFromId ? parseInt(collectedFromId) : null,
                    collectedAt: new Date(),
                },
            });
            return NextResponse.json(updated);
        }

        // If collectionType is NONE and no existing record, nothing to do
        if (collectionType === 'NONE') {
            return NextResponse.json({ deleted: false, message: 'No record to delete' });
        }

        // Create new
        const testMaster = await prisma.testMaster.create({
            data: {
                campusId: parseInt(campusId),
                schoolId: parseInt(schoolId),
                grade,
                year: parseInt(year),
                semester,
                subject,
                collectionType: collectionType || 'BOTH',
                status: 'COLLECTED',
                collectedByName,
                collectedFromId: collectedFromId ? parseInt(collectedFromId) : null,
                collectedAt: new Date(),
            },
        });
        return NextResponse.json(testMaster);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create test master' }, { status: 500 });
    }
}

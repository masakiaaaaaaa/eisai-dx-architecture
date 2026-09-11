import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Helper for session validation
async function getCampusId() {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) {
        return null;
    }

    try {
        const sessionData = JSON.parse(authSession.value);
        return parseInt(sessionData.campusId);
    } catch (e) {
        return null;
    }
}

// POST: Add a test schedule to a school
export async function POST(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { schoolId, name, start, end, collectGrades } = body;

        if (!schoolId || !name || !start || !end) {
            return NextResponse.json({ error: 'Missing required fields (schoolId, name, start, end)' }, { status: 400 });
        }

        // Verify school belongs to this campus
        const school = await prisma.school.findFirst({
            where: { id: Number(schoolId), campusId }
        });

        if (!school) {
            return NextResponse.json({ error: 'School not found or unauthorized' }, { status: 404 });
        }

        // Parse existing testDates
        let testDates: any[] = [];
        try {
            if (school.testDates && school.testDates !== '') {
                let parsed = typeof school.testDates === 'string'
                    ? JSON.parse(school.testDates)
                    : school.testDates;
                // Handle double-escaped JSON
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                if (Array.isArray(parsed)) {
                    testDates = parsed;
                }
            }
        } catch (e) {
            testDates = [];
        }

        // Check for duplicate name
        const duplicate = testDates.find((t: any) => t.name === name);
        if (duplicate) {
            return NextResponse.json({ error: `テスト「${name}」は既に登録されています` }, { status: 409 });
        }

        // Add new test schedule
        const newTest = {
            name,
            start,
            end,
            collectGrades: collectGrades || ['中1', '中2', '中3'],
            collectEnabled: true,
            notifyWeeksBefore: 4
        };

        testDates.push(newTest);

        // Save back to school
        await prisma.school.update({
            where: { id: school.id },
            data: {
                testDates: JSON.stringify(testDates)
            }
        });

        return NextResponse.json({ success: true, testSchedule: newTest });

    } catch (error: any) {
        console.error('Extension Test Schedule Create Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error?.message || String(error)}` }, { status: 500 });
    }
}

// DELETE: Remove a test schedule from a school
export async function DELETE(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const testName = searchParams.get('name');

    if (!schoolId || !testName) {
        return NextResponse.json({ error: 'schoolId and name required' }, { status: 400 });
    }

    try {
        const school = await prisma.school.findFirst({
            where: { id: Number(schoolId), campusId }
        });

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        let testDates: any[] = [];
        try {
            if (school.testDates && school.testDates !== '') {
                let parsed = typeof school.testDates === 'string'
                    ? JSON.parse(school.testDates)
                    : school.testDates;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                if (Array.isArray(parsed)) testDates = parsed;
            }
        } catch (e) {
            testDates = [];
        }

        testDates = testDates.filter((t: any) => t.name !== testName);

        await prisma.school.update({
            where: { id: school.id },
            data: { testDates: JSON.stringify(testDates) }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Extension Test Schedule Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

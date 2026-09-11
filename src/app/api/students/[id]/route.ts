
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Helper function to get authenticated campus ID
async function getAuthenticatedCampusId(): Promise<number | null> {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) return null;

    try {
        const sessionData = JSON.parse(authSession.value);
        const campusId = parseInt(sessionData.campusId);
        return isNaN(campusId) ? null : campusId;
    } catch {
        return null;
    }
}

// GET: Fetch single student
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authentication check
    const authenticatedCampusId = await getAuthenticatedCampusId();
    if (!authenticatedCampusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = await params;
    const id = parseInt(p.id);

    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id },
            include: { school: true }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Verify campus access
        if (student.campusId !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(student);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT/PATCH: Update student
async function update_handler(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authentication check
    const authenticatedCampusId = await getAuthenticatedCampusId();
    if (!authenticatedCampusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = await params;
    const id = parseInt(p.id);

    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        // First verify student belongs to authenticated campus
        const existingStudent = await prisma.student.findUnique({ where: { id } });
        if (!existingStudent || existingStudent.campusId !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const { name, furigana, schoolId, grade, description, studentId, isHighlighted, isChurnRisk, churnRiskReason } = body;

        const isDescriptionChanged = description !== undefined && description !== existingStudent.description;

        const updated = await prisma.student.update({
            where: { id },
            data: {
                name,
                furigana,
                schoolId: schoolId ? parseInt(schoolId) : undefined,
                grade,
                description,
                ...(isDescriptionChanged ? { noteUpdatedAt: new Date() } : {}),
                studentId,
                ...(typeof isHighlighted === 'boolean' ? { isHighlighted } : {}),
                ...(typeof isChurnRisk === 'boolean' ? { isChurnRisk } : {}),
                ...(churnRiskReason !== undefined ? { churnRiskReason } : {}),
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update Student Error:', error);
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }
}

export { update_handler as PUT, update_handler as PATCH };

// DELETE: Remove student
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Authentication check
    const authenticatedCampusId = await getAuthenticatedCampusId();
    if (!authenticatedCampusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const p = await params;
    const id = parseInt(p.id);

    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        // First verify student belongs to authenticated campus
        const existingStudent = await prisma.student.findUnique({ where: { id } });
        if (!existingStudent || existingStudent.campusId !== authenticatedCampusId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        await prisma.student.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
    }
}

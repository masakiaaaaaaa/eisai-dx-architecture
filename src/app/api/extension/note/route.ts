import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Helper for session validation (Duplicated from status/route.ts - ideally should be a middleware or helper)
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

export async function POST(request: Request) {
    const campusId = await getCampusId();
    if (!campusId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId, content } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }

        // Verify student belongs to this campus
        const student = await prisma.student.findFirst({
            where: {
                studentId: studentId,
                campusId: campusId
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Update the description (Shared Note)
        const updated = await prisma.student.update({
            where: { id: student.id },
            data: {
                description: content,
                noteUpdatedAt: new Date()
            }
        });

        // Auto-create/update announcement for LINE notification (1-week period)
        if (content && content.trim()) {
            const now = new Date();
            const oneWeekLater = new Date(now);
            oneWeekLater.setDate(now.getDate() + 7);

            // Upsert: find existing auto-generated announcement for this student, or create new
            const autoTitle = '📝 特記事項更新';
            const existingAuto = await prisma.announcement.findFirst({
                where: {
                    campusId,
                    studentId: student.id,
                    title: autoTitle,
                },
                orderBy: { createdAt: 'desc' }
            });

            const notePreview = content.trim().length > 100
                ? content.trim().substring(0, 100) + '...'
                : content.trim();

            if (existingAuto) {
                await prisma.announcement.update({
                    where: { id: existingAuto.id },
                    data: {
                        detail: notePreview,
                        notifyStart: now,
                        notifyEnd: oneWeekLater,
                        resolvedAt: null, // Re-activate if previously resolved
                    }
                });
            } else {
                await prisma.announcement.create({
                    data: {
                        campusId,
                        studentId: student.id,
                        title: autoTitle,
                        detail: notePreview,
                        importance: 'MEDIUM',
                        notifyStart: now,
                        notifyEnd: oneWeekLater,
                    }
                });
            }
        }

        return NextResponse.json({ success: true, data: updated });

    } catch (error: any) {
        console.error('Extension Note Update Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error?.message || String(error)}` }, { status: 500 });
    }
}

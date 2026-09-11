import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    console.log('JSON Batch Import: Request received');

    try {
        const body = await request.json();
        const { campusId, password, students } = body;

        if (!campusId || !password) {
            return NextResponse.json({ error: 'Campus ID and Password are required' }, { status: 400 });
        }

        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: 'No students provided' }, { status: 400 });
        }

        // Get campus to verify password
        const campus = await prisma.campus.findFirst({
            where: { id: parseInt(campusId) },
        });

        if (!campus) {
             return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
        }

        // Verify Password
        let isValid = false;
        if (!campus.adminPassword) {
            // Fallback to admin1234 if not set yet
            if (password === 'admin1234') {
                isValid = true;
            }
        } else {
            // Check if it's a bcrypt hash
            if (campus.adminPassword.startsWith('$2')) {
                isValid = await bcrypt.compare(password, campus.adminPassword);
            }
            
            // If not valid as bcrypt or not a hash, try plain text comparison
            if (!isValid) {
                isValid = password === campus.adminPassword;
            }
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const results = {
            created: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            errors: [] as string[]
        };


        // Process each student
        for (let i = 0; i < students.length; i++) {
            try {
                const s = students[i];
                if (!s.studentId || !s.name) {
                    results.failed++;
                    continue;
                }

                // Find or create school
                let school = await prisma.school.findFirst({
                    where: { name: s.schoolName, campusId: campus.id },
                });

                if (!school) {
                    school = await prisma.school.create({
                        data: {
                            name: s.schoolName,
                            testDates: '{}',
                            campusId: campus.id
                        },
                    });
                }

                // Use compound unique key: campusId + studentId
                const existingStudent = await prisma.student.findUnique({
                    where: { campusId_studentId: { campusId: campus.id, studentId: s.studentId } },
                });

                if (existingStudent) {
                    await prisma.student.update({
                        where: { id: existingStudent.id },
                        data: {
                            name: s.name,
                            furigana: s.furigana,
                            grade: s.grade || existingStudent.grade,
                            schoolId: school.id,
                            isActive: true,
                            isHighlighted: s.isHighlighted
                        },
                    });
                    results.updated++;
                } else {
                    await prisma.student.create({
                        data: {
                            studentId: s.studentId,
                            name: s.name,
                            furigana: s.furigana,
                            grade: s.grade,
                            campusId: campus.id,
                            schoolId: school.id,
                            isActive: true,
                            isHighlighted: s.isHighlighted
                        },
                    });
                    results.created++;
                }
            } catch (error) {
                console.error(`Error processing row ${i + 1}:`, error);
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
            }
        }

        // Initial batch import: do NOT auto-deactivate (this is the first import for a campus)

        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error('Batch Import Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process batch import', 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

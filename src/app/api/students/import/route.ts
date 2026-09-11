import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import iconv from 'iconv-lite';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    console.log('CSV Import: Request received');
    const debugInfo: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        debugInfo.push(msg);
    };

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const campusId = formData.get('campusId') as string;
        const password = formData.get('password') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!campusId || !password) {
            return NextResponse.json({ error: 'Campus ID and Password are required' }, { status: 400 });
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

        log(`File: ${file.name}, Size: ${file.size}`);

        // Read file content as buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Detect encoding and decode
        let text = iconv.decode(buffer, 'utf-8');
        let encoding = 'utf-8';

        // Simple heuristic
        if (text.includes('') || (!text.includes('生徒ID') && !text.includes('studentId'))) {
            log('UTF-8 decoding failed or header missing, trying Shift-JIS');
            text = iconv.decode(buffer, 'Shift_JIS');
            encoding = 'Shift_JIS';
        }
        log(`Encoding used: ${encoding}`);

        const lines = text.split(/\r?\n/).filter(line => line.trim());
        log(`Lines found: ${lines.length}`);

        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV file is empty or has no data rows', debug: debugInfo }, { status: 400 });
        }

        // Parse CSV header
        const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const header = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
        log(`Header: ${JSON.stringify(header)}`);

        const results = {
            created: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            errors: [] as string[],
            debug: debugInfo
        };

        // Pre-fetch all existing students for this campus for efficient matching
        const existingStudents = await prisma.student.findMany({
            where: { campusId: campus.id },
        });
        log(`Existing students in DB: ${existingStudents.length}`);

        // Build lookup maps for matching
        const studentByIdMap = new Map(existingStudents.map(s => [s.studentId, s]));
        // Name-based lookup: normalize by removing spaces for robust matching
        const studentByNameMap = new Map(existingStudents.map(s => [s.name.replace(/\s+/g, ''), s]));

        // Track matched DB student IDs to detect withdrawals
        const matchedDbIds = new Set<number>();

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
                const record: Record<string, string> = {};

                header.forEach((h, idx) => {
                    record[h] = values[idx] || '';
                });

                // Extract fields
                const studentId = record['会員番号'] || record['生徒ID'] || record['studentId'] || record['student_id'] || record['ID'] || '';
                const lastName = record['姓'] || record['lastName'] || '';
                const firstName = record['名'] || record['firstName'] || '';
                const lastNameKana = record['姓（フリガナ）'] || record['姓(フリガナ)'] || record['lastNameKana'] || '';
                const firstNameKana = record['名（フリガナ）'] || record['名(フリガナ)'] || record['firstNameKana'] || '';
                const grade = record['学年'] || record['grade'] || '';
                const schoolName = record['学校名'] || record['school'] || record['学校'] || '';

                // CSV-based withdrawal detection: use 在籍 and 退会日 columns
                const enrollmentStatus = record['在籍'] || '';
                const withdrawalDate = record['退会日'] || '';
                const isWithdrawnInCSV = enrollmentStatus === '退会' || (enrollmentStatus !== '在籍' && !!withdrawalDate);

                if (!studentId || !lastName || !firstName) {
                    if (i <= 5) log(`Row ${i} skipped: Missing ID/Name. ID=${studentId}, Name=${lastName} ${firstName}`);
                    results.failed++;
                    continue;
                }

                const name = `${lastName} ${firstName}`;
                const furigana = `${lastNameKana} ${firstNameKana}`.trim();
                const normalizedName = name.replace(/\s+/g, '');

                // Find or create school
                let school = null;
                const targetSchoolName = schoolName || '未設定';

                school = await prisma.school.findFirst({
                    where: { name: targetSchoolName, campusId: campus.id },
                });

                if (!school) {
                    school = await prisma.school.create({
                        data: {
                            name: targetSchoolName,
                            campusId: campus.id,
                            testDates: '{}'
                        },
                    });
                }

                // --- Improved matching: studentId first, then name fallback ---
                let existingStudent = studentByIdMap.get(studentId) || null;

                if (!existingStudent) {
                    // Fallback: match by normalized name within the same campus
                    existingStudent = studentByNameMap.get(normalizedName) || null;
                    if (existingStudent) {
                        log(`Row ${i}: ID mismatch, matched by name: "${name}" (DB studentId="${existingStudent.studentId}" → CSV studentId="${studentId}")`);
                    }
                }

                if (existingStudent) {
                    matchedDbIds.add(existingStudent.id);

                    // Determine active status from CSV data
                    const shouldBeActive = !isWithdrawnInCSV;

                    await prisma.student.update({
                        where: { id: existingStudent.id },
                        data: {
                            studentId, // Update to latest CSV studentId (会員番号)
                            name,
                            furigana,
                            grade: grade || existingStudent.grade,
                            schoolId: school.id,
                            isActive: shouldBeActive,
                            ...(isWithdrawnInCSV && !existingStudent.graduatedAt ? { graduatedAt: withdrawalDate ? new Date(withdrawalDate) : new Date() } : {}),
                            ...(shouldBeActive && existingStudent.graduatedAt ? { graduatedAt: null } : {}), // Re-activate if they return
                        },
                    });
                    if (isWithdrawnInCSV) {
                        results.deleted++;
                        log(`Row ${i}: "${name}" marked as withdrawn (在籍=${enrollmentStatus}, 退会日=${withdrawalDate})`);
                    } else {
                        results.updated++;
                    }
                } else {
                    // New student - only create if active in CSV
                    if (isWithdrawnInCSV) {
                        log(`Row ${i}: "${name}" skipped (already withdrawn in CSV)`);
                        continue;
                    }

                    await prisma.student.create({
                        data: {
                            studentId,
                            name,
                            furigana,
                            grade: grade || '未設定',
                            campusId: campus.id,
                            schoolId: school.id,
                            isActive: true,
                            isHighlighted: true
                        },
                    });
                    results.created++;
                }
            } catch (error) {
                log(`Error processing row ${i + 1}: ${error}`);
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
            }
        }

        // Safety: report unmatched DB students but do NOT auto-deactivate them
        const unmatchedStudents = existingStudents.filter(s => s.isActive && !matchedDbIds.has(s.id));
        if (unmatchedStudents.length > 0) {
            log(`WARNING: ${unmatchedStudents.length} active DB students were not matched to any CSV row (left untouched):`);
            unmatchedStudents.forEach(s => log(`  - id=${s.id}, studentId=${s.studentId}, name=${s.name}`));
        }

        log(`Completed: Created=${results.created}, Updated=${results.updated}, Withdrawn=${results.deleted}, Failed=${results.failed}, Unmatched=${unmatchedStudents.length}`);
        return NextResponse.json({ ...results, unmatched: unmatchedStudents.length });
    } catch (error) {
        log(`Fatal error: ${error}`);
        return NextResponse.json({ error: 'Failed to import students: ' + (error as Error).message, debug: debugInfo }, { status: 500 });
    }
}

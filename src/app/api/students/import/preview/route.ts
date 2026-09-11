import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import iconv from 'iconv-lite';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    console.log('CSV Import Preview: Request received');
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

        const parsedStudents = [];

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

                if (!studentId || !lastName || !firstName) {
                    if (i <= 5) log(`Row ${i} skipped: Missing ID/Name. ID=${studentId}, Name=${lastName} ${firstName}`);
                    continue;
                }

                const name = `${lastName} ${firstName}`;
                const furigana = `${lastNameKana} ${firstNameKana}`.trim();

                parsedStudents.push({
                    studentId,
                    name,
                    furigana,
                    grade: grade || '未設定',
                    schoolName: schoolName || '未設定',
                    isHighlighted: false // Default checkbox visual state in preview UI
                });
            } catch (error) {
                log(`Error processing row ${i + 1}: ${error}`);
            }
        }

        return NextResponse.json({ 
            students: parsedStudents, 
            debug: debugInfo 
        });

    } catch (error) {
        console.error('CSV Preview Error:', error);
        return NextResponse.json({ 
            error: 'Failed to process CSV file', 
            details: error instanceof Error ? error.message : String(error),
            debug: debugInfo
        }, { status: 500 });
    }
}

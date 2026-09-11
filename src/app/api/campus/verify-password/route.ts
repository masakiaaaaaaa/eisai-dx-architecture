import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { campusId, password } = await request.json();

        if (!campusId || typeof password !== 'string') {
            return NextResponse.json({ error: 'Missing campusId or password' }, { status: 400 });
        }

        const campus = await prisma.campus.findUnique({
            where: { id: parseInt(campusId.toString()) }
        });

        if (!campus) {
            return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
        }

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

        if (isValid) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('Verify password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

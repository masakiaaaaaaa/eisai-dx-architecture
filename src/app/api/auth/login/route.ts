import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campusId, passcode } = body;

        if (!campusId || !passcode) {
            return NextResponse.json({ error: '校舎と合言葉を入力してください' }, { status: 400 });
        }

        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
        });

        if (!campus) {
            return NextResponse.json({ error: '校舎が見つかりません' }, { status: 404 });
        }

        // Determine role based on password match
        let role = 'lecturer';
        
        // Admin password check logic
        let isAdmin = false;
        if (!campus.adminPassword) {
            // Fallback to admin1234 if not set in DB
            if (passcode === 'admin1234') {
                isAdmin = true;
            }
        } else {
            // Check if it's a bcrypt hash (usually starts with $2)
            if (campus.adminPassword.startsWith('$2')) {
                isAdmin = await bcrypt.compare(passcode, campus.adminPassword);
            }
            
            // If not valid as bcrypt or not a hash, try plain text comparison
            if (!isAdmin) {
                isAdmin = passcode === campus.adminPassword;
            }
        }

        if (isAdmin) {
            role = 'admin';
        } else if (passcode === campus.passcode) {
            role = 'lecturer';
        } else {
            return NextResponse.json({ error: '合言葉が間違っています' }, { status: 401 });
        }

        // Set cookie
        // 1 year expiration for "Remember me" effect
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        const response = NextResponse.json({ success: true, role });

        response.cookies.set('auth_session', JSON.stringify({ campusId, role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'ログイン処理に失敗しました' }, { status: 500 });
    }
}

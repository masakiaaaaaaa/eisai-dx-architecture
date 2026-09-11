import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Disable in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    return NextResponse.json({
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
        nodeEnv: process.env.NODE_ENV,
    });
}

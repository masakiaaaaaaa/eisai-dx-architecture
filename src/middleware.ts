import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protected routes - redirect to login if no session
    const protectedPaths = [
        '/dashboard',
        '/test-schedule',
        '/events',
        '/announcements',
        '/students',
    ];

    const isProtected = protectedPaths.some((p) => path.startsWith(p));

    if (isProtected) {
        const authSession = request.cookies.get('auth_session');

        if (!authSession) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    // CORS for API routes
    if (path.startsWith('/api/')) {
        const origin = request.headers.get('origin');

        // Handle Preflight (OPTIONS)
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin || '*',
                    'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, POST, PUT, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
                    'Access-Control-Allow-Credentials': 'true',
                }
            });
        }

        // Add headers to actual response
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, PATCH, POST, PUT, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/dashboard/:path*',
        '/test-schedule/:path*',
        '/events/:path*',
        '/announcements/:path*',
        '/students/:path*',
    ],
};

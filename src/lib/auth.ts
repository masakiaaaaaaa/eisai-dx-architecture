import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type AuthSession = {
    campusId: number;
    role: 'lecturer' | 'admin';
};

/**
 * Verifies auth_session cookie and returns the authenticated campus ID.
 * Returns null and a 401 response if authentication fails.
 */
export async function getAuthenticatedCampusId(): Promise<{
    campusId: number;
    role: string;
    error?: NextResponse;
}> {
    const cookieStore = await cookies();
    const authSession = cookieStore.get('auth_session');

    if (!authSession || !authSession.value) {
        return {
            campusId: 0,
            role: '',
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    try {
        const sessionData: AuthSession = JSON.parse(authSession.value);
        const campusId = Number(sessionData.campusId);
        if (isNaN(campusId) || campusId <= 0) {
            return {
                campusId: 0,
                role: '',
                error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }),
            };
        }
        return { campusId, role: sessionData.role || 'lecturer' };
    } catch {
        return {
            campusId: 0,
            role: '',
            error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }),
        };
    }
}

/**
 * Validates that the requested campusId matches the authenticated campusId.
 * Returns a 403 response if access is denied.
 */
export function validateCampusAccess(
    requestedCampusId: number,
    authenticatedCampusId: number,
): NextResponse | null {
    if (!requestedCampusId || requestedCampusId !== authenticatedCampusId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return null;
}

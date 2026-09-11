import { NextResponse } from 'next/server';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';
import { getAuthenticatedCampusId, validateCampusAccess } from '@/lib/auth';

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
    // Authentication check
    const auth = await getAuthenticatedCampusId();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const campusId = parseInt(searchParams.get('campusId') || '0');

    // Verify campus access
    const accessError = validateCampusAccess(campusId, auth.campusId);
    if (accessError) return accessError;

    try {
        const data = await fetchWeeklyLineData(auth.campusId);
        return NextResponse.json(data.announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

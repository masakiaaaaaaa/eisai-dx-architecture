import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLineClient } from '@/lib/line'; // Updated import
import { buildWeeklyFlexMessage } from '@/lib/line-message-builder';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // SECURITY: Verify CRON_SECRET for Vercel Cron Jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch Active Line Groups
        const lineGroups = await prisma.lineGroup.findMany({
            include: { campus: true },
        });

        if (lineGroups.length === 0) {
            return NextResponse.json({ message: 'No active line groups found' });
        }

        // 2. Check Schedule (Timezone: JST)
        // Cron runs daily at 12:00 JST, so we only check day of week
        const now = new Date();
        const jstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

        // Get JST Day of Week (e.g. "Monday")
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[jstDate.getDay()];

        console.log(`Cron execution at JST: ${currentDay} 12:00 (daily check)`);

        const results = [];

        for (const group of lineGroups) {
            const { campusId, groupId, campus } = group;

            // Get configured days (comma-separated numeric values like "1,2" for Mon, Tue)
            const configuredDays = (campus.notifyDayOfWeek || '1').split(',').map(d => d.trim());

            // Get current day as numeric string (0=Sun, 1=Mon, ... 6=Sat)
            const currentDayIndex = jstDate.getDay().toString();

            // Check if today matches any configured day
            const dayMatches = configuredDays.includes(currentDayIndex);

            if (!dayMatches) {
                // Skip this group - not the right day
                continue;
            }

            console.log(`Sending to campus ${campusId} (Group: ${groupId}) - Day match: configured days ${configuredDays.join(',')}`, `Today: ${currentDayIndex}`);

            try {
                // Fetch data using common fetcher
                const { missions, events, announcements, individualItems, individualTestSchedules, schoolsNeedingScoreCollection } = await fetchWeeklyLineData(campusId);

                // Build Message
                const flexMessage = buildWeeklyFlexMessage({
                    missions,
                    events,
                    announcements,
                    individualItems,
                    individualTestSchedules,
                    schoolsNeedingScoreCollection,
                    passcode: group.campus.passcode,
                    campusId: group.campus.id,
                });

                // Get Client Spcific for Campus
                const client = await getLineClient(campusId);

                // Send Push Message to Group
                await client.pushMessage({
                    to: groupId,
                    messages: [flexMessage as any],
                });

                results.push({ campusId, groupId, success: true });

            } catch (error: any) {
                console.error(`Failed to send weekly notification to campus ${campusId} (group: ${groupId}):`, error);

                // LINE API Error Handling
                let errorMessage = error.message;
                if (error.originalError && error.originalError.response && error.originalError.response.data) {
                    errorMessage += ` (LINE API: ${JSON.stringify(error.originalError.response.data)})`;
                }

                results.push({
                    campusId,
                    groupId,
                    success: false,
                    error: errorMessage
                });
            }
        }

        return NextResponse.json({ success: true, results, executedAtJST: `${currentDay} 12:00` });
    } catch (error) {
        console.error('Weekly cron fatal error:', error);
        return NextResponse.json({ error: 'Failed to send weekly notifications' }, { status: 500 });
    }
}

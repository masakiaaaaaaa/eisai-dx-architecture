import { NextResponse } from 'next/server';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';

// Widget API - Returns full notification data for Rainmeter/desktop widgets
// Usage: GET /api/widget?campusId=1
// Usage: GET /api/widget?campusId=1&format=text (for Rainmeter INI format)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = parseInt(searchParams.get('campusId') || '1');
    const format = searchParams.get('format');

    try {
        const data = await fetchWeeklyLineData(campusId);

        // Format dates helper
        const formatDate = (date: any, endDate?: any) => {
            try {
                const d = new Date(date);
                let str = d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                if (endDate) {
                    const ed = new Date(endDate);
                    if (ed.getTime() !== d.getTime()) {
                        str += '~' + ed.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
                    }
                }
                return str;
            } catch { return ''; }
        };

        // Format events with full details
        const eventDetails = data.events.map((event: any) => ({
            title: event.title || 'Event',
            date: formatDate(event.date, event.endDate),
            description: event.description || ''
        }));

        // Format announcements with full details
        const announcementDetails = data.announcements.map((ann: any) => ({
            title: ann.title || 'Announcement',
            content: ann.detail || '',
            importance: ann.importance || 'NORMAL'
        }));

        // Format missions (uncollected tests) with full details
        const missionDetails = data.missions.map((m: any) => ({
            school: m.school?.name || '',
            grade: m.grade || '',
            semester: m.semester || '',
            subjects: m.subjects?.join(', ') || '',
            assignedStudent: m.assignedStudent || ''
        }));

        // Format individual items
        const individualDetails = data.individualItems.map((item: any) => ({
            type: item.type,
            studentName: item.studentName
        }));

        // Current time in JST
        const now = new Date();
        const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
        const lastUpdate = jstNow.toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // If format=text, return INI format for Rainmeter @Include
        if (format === 'text') {
            let text = `[Variables]\n`;
            text += `Ann=${data.announcements.length}\n`;
            text += `Evt=${data.events.length}\n`;
            text += `Mis=${data.missions.length}\n`;
            text += `Ind=${data.individualItems.length}\n`;
            text += `LastUpdate=${lastUpdate}\n`;

            // Base URL for links
            const baseUrl = 'https://eisai-api.vercel.app';

            // Helper to fill array to N items
            const fill = (arr: any[], count: number, prefix: string) => {
                let res = '';
                for (let i = 0; i < count; i++) {
                    const item = arr[i];
                    if (prefix === 'Evt') {
                        res += `${prefix}${i + 1}Title=${item ? item.title : ''}\n`;
                        res += `${prefix}${i + 1}Date=${item ? item.date : ''}\n`;
                        res += `${prefix}${i + 1}Link=${baseUrl}/events\n`;
                    } else if (prefix === 'Ann') {
                        // Use full content with #CRLF# for newlines in Rainmeter
                        const content = item && item.content ? item.content.replace(/[\r\n]+/g, '#CRLF#') : '';
                        res += `${prefix}${i + 1}Title=${item ? item.title : ''}\n`;
                        res += `${prefix}${i + 1}Content=${content}\n`;
                        res += `${prefix}${i + 1}Important=${item && item.importance === 'HIGH' ? '!' : ''}\n`;
                        res += `${prefix}${i + 1}Link=${baseUrl}/announcements\n`;
                    } else if (prefix === 'Mis') {
                        res += `${prefix}${i + 1}School=${item ? item.school : ''}\n`;
                        res += `${prefix}${i + 1}Grade=${item ? item.grade : ''}\n`;
                        res += `${prefix}${i + 1}Semester=${item ? item.semester : ''}\n`;
                        res += `${prefix}${i + 1}Subjects=${item ? item.subjects : ''}\n`;
                        res += `${prefix}${i + 1}Link=${baseUrl}/collection\n`;
                    } else if (prefix === 'Ind') {
                        res += `${prefix}${i + 1}Student=${item ? item.studentName : ''}\n`;
                        res += `${prefix}${i + 1}Type=${item ? (item.type === 'event' ? 'Event' : 'Notice') : ''}\n`;
                        res += `${prefix}${i + 1}Link=${baseUrl}/students\n`;
                    }
                }
                return res;
            };


            // Add details with padding up to 10
            text += fill(eventDetails, 10, 'Evt');
            text += fill(announcementDetails, 10, 'Ann');
            text += fill(missionDetails, 10, 'Mis');
            text += fill(individualDetails, 10, 'Ind');

            return new NextResponse(text, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'max-age=60' // Short cache
                }
            });
        }

        // JSON response with full details
        const response = {
            // Summary counts
            announcementCount: data.announcements.length,
            eventCount: data.events.length,
            missionCount: data.missions.length,
            individualCount: data.individualItems.length,
            lastUpdate,

            // Full details
            events: eventDetails,
            announcements: announcementDetails,
            missions: missionDetails,
            individualItems: individualDetails,

            // Schools needing score collection
            schoolsNeedingScores: data.schoolsNeedingScoreCollection || [],
            totalItems: data.announcements.length + data.events.length + data.missions.length
        };

        return NextResponse.json(response, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' // Shared cache for 5 min
            }
        });
    } catch (error) {
        console.error('Widget API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', announcementCount: 0, eventCount: 0, missionCount: 0 },
            { status: 500 }
        );
    }
}

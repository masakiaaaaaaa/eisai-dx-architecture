import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { messagingApi } from "@line/bot-sdk";
import { buildWeeklyFlexMessage } from '@/lib/line-message-builder';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';

const { MessagingApiClient } = messagingApi;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let flexMessage: any = null;

    try {
        const body = await req.json();
        const { campusId, isTest, groupId } = body;  // Added groupId parameter
        const targetCampusId = Number(campusId);

        if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            // Check later after campus lookup
        }

        let channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        // Fetch Campus Token if available
        if (targetCampusId) {
            const campus = await prisma.campus.findUnique({
                where: { id: targetCampusId }
            });
            if (campus && campus.lineAccessToken) {
                channelAccessToken = campus.lineAccessToken;
            }
        }

        if (!channelAccessToken) {
            console.error('LINE_CHANNEL_ACCESS_TOKEN is not set and no campus token found');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const client = new MessagingApiClient({
            channelAccessToken: channelAccessToken,
        });

        // 1. Find LINE groups for the campus
        let lineGroups;
        if (groupId) {
            // If specific groupId provided, use only that group
            lineGroups = await prisma.lineGroup.findMany({
                where: { id: Number(groupId), campusId: targetCampusId },
                include: { campus: true }
            });
        } else {
            // Otherwise, get all groups for the campus
            lineGroups = await prisma.lineGroup.findMany({
                where: { campusId: targetCampusId },
                include: { campus: true }
            });
        }

        if (lineGroups.length === 0) {
            return NextResponse.json({
                error: groupId
                    ? 'Specified LINE group not found.'
                    : 'No linked LINE group found. Please invite the bot to a group first.'
            }, { status: 404 });
        }

        // 2. Fetch Real Data using common fetcher
        const { missions, events, announcements, individualItems, individualTestSchedules, schoolsNeedingScoreCollection } = await fetchWeeklyLineData(targetCampusId);

        // 3. Build Flex Message (use first group's campus for passcode)
        flexMessage = buildWeeklyFlexMessage({
            missions,
            events,
            announcements,
            individualItems,
            individualTestSchedules,
            schoolsNeedingScoreCollection,
            passcode: lineGroups[0].campus.passcode,
            campusId: targetCampusId,
        });

        // Override altText for Test
        if (isTest) {
            flexMessage.altText = "【テスト送信】今週のお知らせ";
        }

        // 4. Send Message to ALL groups
        console.log(`--- SENDING TO ${lineGroups.length} GROUPS ---`);

        const results: { groupId: string; success: boolean; error?: string }[] = [];

        for (const lineGroup of lineGroups) {
            try {
                await client.pushMessage({
                    to: lineGroup.groupId,
                    messages: [flexMessage as any],
                });
                results.push({ groupId: lineGroup.groupId, success: true });
                console.log(`✓ Sent to ${lineGroup.groupId}`);
            } catch (err: any) {
                results.push({ groupId: lineGroup.groupId, success: false, error: err.message });
                console.error(`✗ Failed ${lineGroup.groupId}: ${err.message}`);
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`--- DONE: ${successCount} success, ${failCount} failed ---`);

        return NextResponse.json({
            success: failCount === 0,
            totalGroups: lineGroups.length,
            successCount,
            failCount,
            results
        });

    } catch (error: any) {
        console.error('LINE Send Error:', error);

        let errorMessage = error.message;
        if (error.originalError && error.originalError.response && error.originalError.response.data) {
            errorMessage += ` (LINE API: ${JSON.stringify(error.originalError.response.data)})`;
        }

        return NextResponse.json({
            error: 'Failed to send message',
            details: errorMessage,
            payload: flexMessage
        }, { status: 500 });
    }
}


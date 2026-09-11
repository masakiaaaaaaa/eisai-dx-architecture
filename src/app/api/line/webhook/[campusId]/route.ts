import { NextResponse } from 'next/server';
import { validateSignature, WebhookEvent, messagingApi } from '@line/bot-sdk';
import { getLineClient } from '@/lib/line';
import { prisma } from '@/lib/prisma';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';
import { buildWeeklyFlexMessage } from '@/lib/line-message-builder';

interface RouteParams {
    params: Promise<{
        campusId: string;
    }>;
}

export async function POST(request: Request, { params }: RouteParams) {
    const { campusId: campusIdStr } = await params;
    const campusId = parseInt(campusIdStr);
    if (isNaN(campusId)) {
        return NextResponse.json({ error: 'Invalid campus ID' }, { status: 400 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-line-signature') as string;

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    try {
        // 1. Get Campus Secret & Name
        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
            select: { lineChannelSecret: true, name: true, lineAccessToken: true }
        });

        if (!campus) {
            return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
        }

        // Use DB secret if available, otherwise fallback to env (only for ID 1 or migration)
        const channelSecret = campus.lineChannelSecret || process.env.LINE_CHANNEL_SECRET || '';

        if (!validateSignature(body, channelSecret, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const data = JSON.parse(body);
        const events: WebhookEvent[] = data.events;

        // Get Client for this campus
        const client = await getLineClient(campusId);

        await Promise.all(events.map(async (event) => {
            try {
                await handleEvent(event, client, campusId, campus.name);
            } catch (err) {
                console.error('Error handling event:', err);
            }
        }));

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function handleEvent(event: WebhookEvent, client: messagingApi.MessagingApiClient, campusId: number, campusName: string) {
    // Handle Group Join Event
    if (event.type === 'join') {
        if (event.source.type === 'group' || event.source.type === 'room') {
            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `招待ありがとうございます！\nここは「${campusName}」の通知用公式アカウントです。\nこのグループに通知を送るには、以下のコマンドを送信してください。\n\nコマンド：\n設定`,
                }],
            });
        }
        return;
    }

    // Handle Follow Event (Friend Add)
    if (event.type === 'follow') {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
                type: 'text',
                text: `友達追加ありがとうございます！\nここは「${campusName}」の公式アカウントです。\n\n【使い方】\n1. 通知を受け取りたいLINEグループを作成し、このBotを招待してください。\n2. グループ内で「設定」と送信してください。\n\n個人チャットには通知は送られません。`,
            }],
        });
        return;
    }

    // Handle Message Event
    if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const groupId = event.source.type === 'group' ? event.source.groupId :
            event.source.type === 'room' ? event.source.roomId : null;

        // "設定" command (or "設定 [CampusName]" for backward compatibility logic if someone types it)
        const isSettingCommand = text === '設定' || text.startsWith('設定 ');

        if (isSettingCommand) {
            // Only allow setting in groups/rooms
            if (event.source.type !== 'group' && event.source.type !== 'room') {
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                        type: 'text',
                        text: 'このコマンドはグループ内でのみ使用できます。',
                    }],
                });
                return;
            }

            if (!groupId) return;

            // Create or Update LineGroup directly linked to this campus
            await prisma.lineGroup.upsert({
                where: { groupId },
                update: { campusId: campusId },
                create: {
                    groupId,
                    campusId: campusId,
                },
            });

            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `完了しました！\nこのグループを「${campusName}」の通知先に設定しました。\n毎週月曜日にレポートをお届けします。\n\n💡 「通知」と送信するといつでも最新の情報を確認できます。`,
                }],
            });
            return;
        }

        // ================================================
        // Keyword-based reply
        // ================================================
        if (text === '通知' || text === '今週' || text === 'レポート') {
            if (!groupId) {
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                        type: 'text',
                        text: 'この機能はグループ内でのみ使用できます。',
                    }],
                });
                return;
            }

            // Check if registered
            const lineGroup = await prisma.lineGroup.findUnique({
                where: { groupId },
            });

            if (!lineGroup || lineGroup.campusId !== campusId) {
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                        type: 'text',
                        text: `このグループは「${campusName}」に紐付けられていません。\n「設定」と送信してください。`,
                    }],
                });
                return;
            }

            try {
                const weeklyData = await fetchWeeklyLineData(campusId);
                const flexMessage = buildWeeklyFlexMessage(weeklyData);

                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [flexMessage as any],
                });

            } catch (error) {
                console.error('Error sending reply notification:', error);
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                        type: 'text',
                        text: '通知の取得中にエラーが発生しました。',
                    }],
                });
            }
            return;
        }

        // ================================================
        // Help command
        // ================================================
        if (text === 'ヘルプ' || text === 'help') {
            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `📚 ${campusName} Botの使い方\n\n` +
                        '【通知を受け取る】\n' +
                        '「通知」と送信 → 最新レポートを表示\n\n' +
                        '【設定】\n' +
                        '「設定」→ このグループを通知先に登録\n\n' +
                        '毎週定期的に自動通知も届きます！',
                }],
            });
            return;
        }
    }
}

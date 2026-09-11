import { NextResponse } from 'next/server';
import { validateSignature, WebhookEvent, messagingApi } from '@line/bot-sdk';
import defaultClient from '@/lib/line';
import { prisma } from '@/lib/prisma';
import { fetchWeeklyLineData } from '@/lib/line-data-fetcher';
import { buildWeeklyFlexMessage } from '@/lib/line-message-builder';

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') as string;

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    try {
        // 各校舎のLINEチャンネル情報をDBから取得
        // 校舎ごとに別々のLINEアカウントを持つため、secret→campus は1対1
        const campuses = await prisma.campus.findMany({
            select: {
                id: true,
                name: true,
                lineChannelSecret: true,
                lineAccessToken: true
            }
        });

        // 署名を検証して、どの校舎のWebhookか特定する
        let matchedCampus: { id: number; name: string; lineAccessToken: string } | null = null;

        for (const campus of campuses) {
            if (campus.lineChannelSecret && campus.lineAccessToken) {
                if (validateSignature(body, campus.lineChannelSecret, signature)) {
                    matchedCampus = {
                        id: campus.id,
                        name: campus.name,
                        lineAccessToken: campus.lineAccessToken
                    };
                    break;
                }
            }
        }

        if (!matchedCampus) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const client = new messagingApi.MessagingApiClient({
            channelAccessToken: matchedCampus.lineAccessToken
        });

        const data = JSON.parse(body);
        const events: WebhookEvent[] = data.events;

        await Promise.all(events.map(async (event) => {
            try {
                await handleEvent(event, client, matchedCampus!);
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

async function handleEvent(
    event: WebhookEvent,
    client: messagingApi.MessagingApiClient,
    campus: { id: number; name: string }
) {
    // =========================================================
    // グループ招待: 自動でLineGroupをDB登録 + 初回レポート送信
    // =========================================================
    if (event.type === 'join') {
        if (event.source.type === 'group' || event.source.type === 'room') {
            const groupId = event.source.type === 'group'
                ? event.source.groupId
                : event.source.roomId;

            if (!groupId) return;

            // DB にグループを登録（既存なら更新）
            await prisma.lineGroup.upsert({
                where: { groupId },
                update: { campusId: campus.id },
                create: { groupId, campusId: campus.id },
            });

            console.log(`[Auto Join] Group ${groupId} → ${campus.name} (ID: ${campus.id})`);

            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `招待ありがとうございます！\n「${campus.name}」の通知グループとして登録しました。\n毎週月曜日に自動でレポートをお届けします。\n\n💡「通知」と送信するといつでも最新情報を確認できます。`,
                }],
            });
        }
        return;
    }

    // =========================================================
    // 友だち追加
    // =========================================================
    if (event.type === 'follow') {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
                type: 'text',
                text: `友達追加ありがとうございます！\n\nこのBotは「${campus.name}」の通知用Botです。\n通知を受け取りたいLINEグループにこのBotを招待してください。\n招待するだけで自動的に設定が完了し、レポートが届きます。`,
            }],
        });
        return;
    }

    // =========================================================
    // メッセージ処理
    // =========================================================
    if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const groupId = event.source.type === 'group' ? event.source.groupId :
            event.source.type === 'room' ? event.source.roomId : null;

        // ---- キーワード通知: 「通知」「今週」「レポート」 ----
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

            // グループが登録済みか確認
            const lineGroup = await prisma.lineGroup.findUnique({
                where: { groupId }
            });

            if (!lineGroup) {
                // 本来joinで登録済みのはずだが、万一の場合はここで登録する
                await prisma.lineGroup.create({
                    data: { groupId, campusId: campus.id }
                });
            }

            try {
                const weeklyData = await fetchWeeklyLineData(campus.id);
                const flexMessage = buildWeeklyFlexMessage(weeklyData);

                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [flexMessage as any],
                });

                console.log(`[Reply Notification] Sent to group ${groupId} for ${campus.name}`);
            } catch (error) {
                console.error('Error sending reply notification:', error);
                await client.replyMessage({
                    replyToken: event.replyToken,
                    messages: [{
                        type: 'text',
                        text: '通知の取得中にエラーが発生しました。しばらくしてからお試しください。',
                    }],
                });
            }
            return;
        }

        // ---- ヘルプ ----
        if (text === 'ヘルプ' || text === 'help') {
            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `📚 ${campus.name} 通知Bot ガイド\n\n` +
                        '【通知を確認する】\n' +
                        '「通知」と送信 → 最新の週次レポートを表示\n\n' +
                        '💡 毎週月曜日に自動でレポートが届きます！',
                }],
            });
            return;
        }
    }
}

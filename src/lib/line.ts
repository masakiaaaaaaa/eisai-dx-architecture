import { messagingApi } from '@line/bot-sdk';
import { prisma } from '@/lib/prisma';

// Default client (using env vars) - Maintain backward compatibility
const client = new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export default client;

export async function getLineClient(campusId: number) {
    const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        select: { lineAccessToken: true }
    });

    if (campus?.lineAccessToken) {
        return new messagingApi.MessagingApiClient({
            channelAccessToken: campus.lineAccessToken,
        });
    }

    // Fallback to default if no specific token is set (or for migration period)
    return client;
}

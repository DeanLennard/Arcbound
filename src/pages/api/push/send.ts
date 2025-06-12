// src/pages/api/push/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';
import { dbConnect } from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

webpush.setVapidDetails(
    'mailto:admin@arcbound.co.uk',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const payload = JSON.stringify({
        title: 'New message received!',
        body: 'Click to view.',
    });

    const subscriptions = await PushSubscription.find();

    await Promise.all(
        subscriptions.map(async sub => {
            try {
                await webpush.sendNotification(sub, payload);
            } catch (err: unknown) {
                console.error('Push failed for:', sub.endpoint, err);

                if (
                    typeof err === 'object' &&
                    err !== null &&
                    'statusCode' in err &&
                    (err as { statusCode: number }).statusCode === 410 ||
                    (err as { statusCode: number }).statusCode === 404
                ) {
                    await PushSubscription.deleteOne({ endpoint: sub.endpoint });
                }
            }
        })
    );

    res.status(200).json({ sent: true });
}

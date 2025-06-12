// src/pages/api/push/subscribe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {dbConnect} from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await dbConnect();
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
        await PushSubscription.updateOne(
            { endpoint },
            { endpoint, keys },
            { upsert: true }
        );
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Error saving subscription:', err);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
}

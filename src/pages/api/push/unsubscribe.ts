// src/pages/api/push/unsubscribe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await requireAuth(req, res);
    if (!session) return;

    await dbConnect();

    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint is required' });
    }

    try {
        await PushSubscription.deleteOne({ endpoint, userId: session.user.id });
        return res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (err) {
        console.error('Failed to unsubscribe:', err);
        return res.status(500).json({ error: 'Failed to unsubscribe' });
    }
}

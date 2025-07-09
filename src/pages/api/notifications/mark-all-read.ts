// src/pages/api/notifications/mark-all-read.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end();
    }

    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    try {
        await Notification.updateMany(
            { userId: session.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to mark all read' });
    }
}

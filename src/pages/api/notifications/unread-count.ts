// src/pages/api/notifications/unread-count.ts
import { dbConnect } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import Notification from '@/models/Notification';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const unreadCount = await Notification.countDocuments({
        userId: session.user.id,
        isRead: false
    });

    return res.status(200).json({ unreadCount });
}

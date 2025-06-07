// src/pages/api/notifications/unread-count.ts
import { dbConnect } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Notification from '@/models/Notification';

export default async function handler(req, res) {
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

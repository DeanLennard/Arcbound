import { dbConnect } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import Notification from '@/models/Notification';

export default async function handler(req, res) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const notifications = await Notification.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .populate('postId', 'title') // Populates the postId field with the title
        .lean();

    res.status(200).json({ notifications });
}

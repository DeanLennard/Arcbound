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

    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { id } = req.query;

    await Notification.findByIdAndUpdate(id, { isRead: true });

    res.status(200).json({ message: 'Notification marked as read' });
}

// src/pages/api/chats/[id]/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    const { id } = req.query;

    if (req.method === 'PATCH') {
        const { groupName, groupImage } = req.body;
        try {
            const chat = await Chat.findOneAndUpdate(
                { _id: id, isGroup: true, members: session.user.id },
                { groupName, groupImage },
                { new: true }
            );
            res.status(200).json({ chat });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update chat' });
        }
    } else {
        res.setHeader('Allow', ['PATCH']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

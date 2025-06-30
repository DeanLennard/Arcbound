// src/pages/api/chats/[id]/messages/[messageId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    const { id: chatId, messageId } = req.query as { id: string; messageId: string };

    if (req.method === 'PUT') {
        const { content } = req.body;
        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Invalid content' });
        }

        const msg = await Message.findOneAndUpdate(
            { _id: messageId, chatId, senderId: session.user.id },
            { content: content.trim(), editedAt: new Date() },
            { new: true }
        )
            .populate('senderId', '_id characterName profileImage');

        if (!msg) return res.status(404).json({ error: 'Not found or not yours' });

        // TODO: socket.emit('messageEdited', msg);
        return res.status(200).json({ message: msg });
    }

    res.setHeader('Allow', ['PUT']);
    res.status(405).end();
}
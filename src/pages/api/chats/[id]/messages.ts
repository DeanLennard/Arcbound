// src/pages/api/chats/[[id]]/messages.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    const { id } = req.query;
    const limit = 20;

    if (req.method === 'GET') {
        try {
            const before = req.query.before as string | undefined;
            const filter: { chatId: mongoose.Types.ObjectId; createdAt?: { $lt: Date } } = { chatId: new mongoose.Types.ObjectId(id as string) };
            if (before && !isNaN(Date.parse(before))) {
                filter.createdAt = { $lt: new Date(before) };
            }

            const messages = await Message.find(filter)
                .populate('senderId', 'characterName profileImage')
                .sort({ createdAt: -1 })  // newest first
                .limit(limit)
                .lean();

            // Reverse them so oldest at top
            const orderedMessages = messages.reverse();

            res.status(200).json({ messages: orderedMessages });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

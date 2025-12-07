// src/pages/api/chats/[id]/messages.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// ---------- TYPES ----------
interface LeanSender {
    _id: mongoose.Types.ObjectId;
    characterName: string;
    profileImage?: string;
}

interface LeanReaction {
    emoji: string;
    users: mongoose.Types.ObjectId[];
}

interface LeanMessage {
    _id: mongoose.Types.ObjectId;
    chatId: mongoose.Types.ObjectId;
    content: string;
    senderId: LeanSender;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;
    readBy: mongoose.Types.ObjectId[];
    reactions: LeanReaction[];
}

// ----------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    const { id } = req.query;
    const limit = 20;

    if (req.method === 'GET') {
        try {
            const before = req.query.before as string | undefined;

            const filter: {
                chatId: mongoose.Types.ObjectId;
                createdAt?: { $lt: Date };
            } = {
                chatId: new mongoose.Types.ObjectId(id as string)
            };

            if (before && !isNaN(Date.parse(before))) {
                filter.createdAt = { $lt: new Date(before) };
            }

            const messages = await Message.find(filter)
                .populate('senderId', 'characterName profileImage')
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean<LeanMessage[]>(); // <-- FIXED TYPING HERE

            const orderedMessages = messages
                .reverse()
                .map((msg: LeanMessage) => ({
                    ...msg,
                    _id: msg._id.toString(),
                    chatId: msg.chatId.toString(),
                    senderId: {
                        ...msg.senderId,
                        _id: msg.senderId._id.toString(),
                        profileImage: msg.senderId.profileImage || "/placeholder.jpg"
                    },
                    readBy: msg.readBy?.map((id: mongoose.Types.ObjectId) =>
                        id.toString()
                    ) || [],
                    reactions: msg.reactions?.map((r: LeanReaction) => ({
                        emoji: r.emoji,
                        users: r.users.map((u: mongoose.Types.ObjectId) =>
                            u.toString()
                        )
                    })) || []
                }));

            return res.status(200).json({ messages: orderedMessages });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

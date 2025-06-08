// src/pages/api/chats/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';
import Message from '@/models/Message';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        try {
            const chats = await Chat.find({ members: session.user.id })
                .populate('members', 'characterName profileImage')
                .lean();

            for (const chat of chats) {
                const unreadCount = await Message.countDocuments({
                    chatId: chat._id,
                    senderId: { $ne: session.user.id },
                    readBy: { $ne: session.user.id }
                });
                chat.unreadCount = unreadCount;

                // Fetch last message timestamp
                const lastMessage = await Message.findOne({ chatId: chat._id })
                    .sort({ createdAt: -1 })
                    .select('createdAt')
                    .lean();

                // Fallback to chat creation date if no messages
                chat.lastMessageAt = lastMessage ? lastMessage.createdAt : chat.createdAt;
            }

            res.status(200).json({ chats });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch chats' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

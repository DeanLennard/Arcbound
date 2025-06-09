// src/pages/api/chats/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';
import Message from '@/models/Message';
import type { Chat as ChatType } from '@/types/chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    try {
        await dbConnect();

        const session = await requireAuth(req, res);
        if (!session) return;

        if (req.method === 'GET') {
            const chats = await Chat.find({ members: session.user.id })
                .populate('members', 'characterName profileImage')
                .sort({ updatedAt: -1 })
                .lean<ChatType[]>();

            await Promise.all(chats.map(async (chat) => {
                const latestUnreadMessages = await Message.find({
                    chatId: chat._id,
                    senderId: { $ne: session.user.id },
                    readBy: { $ne: session.user.id }
                })
                    .sort({ createdAt: -1 })
                    .limit(6)
                    .select('_id')
                    .lean();

                chat.unreadCount = latestUnreadMessages.length > 5 ? '5+' : latestUnreadMessages.length;
            }));

            res.status(200).json({ chats });
        } else {
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
}

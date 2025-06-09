// src/pages/api/chats/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';
import Message from '@/models/Message';
import type { Chat as ChatType } from '@/types/chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('API /api/chats hit');

    try {
        console.log('Connecting to DB...');
        await dbConnect();
        console.log('DB Connected.');

        console.log('Fetching session...');
        const session = await requireAuth(req, res);
        if (!session) return;
        console.log('Session fetched:', session.user.id);

        if (req.method === 'GET') {
            console.log('Fetching chats...');
            const chats = await Chat.find({ members: session.user.id })
                .populate('members', 'characterName profileImage')
                .sort({ updatedAt: -1 })
                .lean<ChatType[]>();
            console.log('Chats fetched:', chats.length);

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

            console.log('Responding with chats...');
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

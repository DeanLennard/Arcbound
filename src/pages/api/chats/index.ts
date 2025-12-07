// src/pages/api/chats/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';
import Message from '@/models/Message';
import mongoose from 'mongoose';

type LeanMember = {
    _id: mongoose.Types.ObjectId;
    characterName: string;
    profileImage?: string;
};

type LeanChat = {
    _id: mongoose.Types.ObjectId;
    groupName?: string;
    groupImage?: string;
    isGroup?: boolean;
    createdAt: Date;
    updatedAt: Date;
    members: LeanMember[];
    unreadCount?: number | string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await dbConnect();

        const session = await requireAuth(req, res);
        if (!session) return;

        if (req.method === 'GET') {
            const isAdmin = session.user.role === 'admin';
            const userId = session.user.id;

            const isAdminAll = req.query.all === 'true' && isAdmin;
            const chatQuery = isAdminAll ? {} : { members: userId };

            const chats = await Chat.find(chatQuery)
                .populate('members', 'characterName profileImage')
                .sort({ updatedAt: -1 })
                .lean<LeanChat[]>();  // <--- Proper typing here

            // Build "safe" serialised chats
            const safeChats = chats.map(chat => ({
                _id: chat._id.toString(),
                groupName: chat.groupName || null,
                isGroup: Boolean(chat.isGroup),
                members: chat.members.map((m: any) => ({
                    _id: m._id.toString(),
                    characterName: m.characterName || "",
                    profileImage: m.profileImage || "/placeholder.jpg"
                })),
                updatedAt: chat.updatedAt,
                createdAt: chat.createdAt,
                unreadCount: chat.unreadCount ?? 0
            }));

            // Compute unread counts
            await Promise.all(
                chats.map(async (chat) => {
                    const msgs = await Message.find({
                        chatId: chat._id,
                        senderId: { $ne: session.user.id },
                        readBy: { $ne: session.user.id }
                    })
                        .sort({ updatedAt: -1 })
                        .limit(6)
                        .select('_id')
                        .lean();

                    chat.unreadCount = msgs.length > 5 ? '5+' : msgs.length;
                })
            );

            return res.status(200).json({ chats: safeChats });
        }

        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch chats' });
    }
}

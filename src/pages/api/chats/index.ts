// src/pages/api/chats/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth';
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        await dbConnect();
        const session = await requireAuth(req, res);
        if (!session) return;

        if (req.method !== 'GET') {
            res.setHeader('Allow', ['GET']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

        const isAdmin = session.user.role === 'admin';
        const userId = session.user.id;

        const isAdminAll = req.query.all === 'true' && isAdmin;
        const chatQuery = isAdminAll ? {} : { members: userId };

        const chats = await Chat.find(chatQuery)
            .populate('members', 'characterName profileImage')
            .sort({ updatedAt: -1 })
            .lean<LeanChat[]>();

        // Calculate unread counts BEFORE building safeChats
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

        // Build safe serialisable response
        const safeChats = chats.map((chat) => ({
            _id: chat._id.toString(),
            groupName: chat.groupName || null,
            groupImage: chat.groupImage || null,
            isGroup: Boolean(chat.isGroup),
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            unreadCount: chat.unreadCount ?? 0,
            members: chat.members.map((m: LeanMember) => ({
                _id: m._id.toString(),
                characterName: m.characterName,
                profileImage: m.profileImage || '/placeholder.jpg'
            }))
        }));

        return res.status(200).json({ chats: safeChats });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch chats' });
    }
}

// src/pages/api/chats/[id]/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import PushSubscription from '@/models/PushSubscription';
import webpush from 'web-push';
import mongoose from 'mongoose';

webpush.setVapidDetails(
    'mailto:admin@arcbound.co.uk',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    const { id } = req.query; // chatId

    if (req.method === 'POST') {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        try {
            const message = await Message.create({
                chatId: id,
                senderId: session.user.id,
                content
            });

            const chat = await Chat.findByIdAndUpdate(id, { updatedAt: new Date() });
            if (!chat) return res.status(404).json({ error: 'Chat not found' });

            // ---------- NOTIFICATION LOGIC ----------
            const recipients = (chat.members as mongoose.Types.ObjectId[])
                .map((memberId: mongoose.Types.ObjectId) => memberId.toString())
                .filter((memberId: string) => memberId !== session.user.id);

            const unmutedUsers = await User.find({
                _id: { $in: recipients },
                mutedChats: { $ne: chat._id }
            }).select('_id');

            const notifyIds = unmutedUsers.map((u: { _id: mongoose.Types.ObjectId }) =>
                u._id.toString()
            );

            const subscriptions = await PushSubscription.find({
                userId: { $in: notifyIds }
            });

            const payload = JSON.stringify({
                title: 'Arcbound: New Message',
                body: `You received a message.`,
                icon: '/icon-192.png',
                url: `/forum`,
                tag: `msg-${message._id}`,
                messageId: message._id.toString()
            });

            await Promise.all(
                subscriptions.map(async (sub) => {
                    try {
                        await webpush.sendNotification(sub, payload);
                    } catch (err: unknown) {
                        const code =
                            (err as { statusCode?: number }).statusCode;

                        if (code === 410 || code === 404) {
                            await PushSubscription.deleteOne({
                                endpoint: sub.endpoint
                            });
                        }
                    }
                })
            );

            // ---------- SAFE SERIALISATION ----------
            const safeMessage = {
                _id: message._id.toString(),
                chatId: message.chatId.toString(),
                senderId: message.senderId.toString(),
                content: message.content,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                readBy: (message.readBy || []).map((id: mongoose.Types.ObjectId) =>
                    id.toString()
                ),
                reactions: (message.reactions || []).map(
                    (r: { emoji: string; users: mongoose.Types.ObjectId[] }) => ({
                        emoji: r.emoji,
                        users: r.users.map((u: mongoose.Types.ObjectId) =>
                            u.toString()
                        )
                    })
                )
            };

            return res.status(201).json({ message: safeMessage });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

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

    const { id } = req.query;

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

            // Notify all other members
            const recipients = (chat.members as mongoose.Types.ObjectId[])
                .map(id => id.toString())
                .filter(id => id !== session.user.id);

            // Get users who have NOT muted this chat
            const unmutedUsers = await User.find({
                _id: { $in: recipients },
                mutedChats: { $ne: chat._id },
            }).select('_id');

            const notifyIds = unmutedUsers.map(u => u._id.toString());

            const subscriptions = await PushSubscription.find({ userId: { $in: notifyIds } });

            const payload = JSON.stringify({
                title: 'Arcbound: New Message',
                body: `You received a message.`,
                icon: '/icon-192.png',
                url: `/forum` // Useful for the client
            });

            await Promise.all(
                subscriptions.map(async sub => {
                    try {
                        await webpush.sendNotification(sub, payload);
                    }catch (err: unknown) {
                        if (
                            typeof err === 'object' &&
                            err !== null &&
                            'statusCode' in err &&
                            (err as { statusCode: number }).statusCode === 410 || (err as { statusCode: number }).statusCode === 404
                        ) {
                            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
                        }
                    }
                })
            );


            res.status(201).json({ message });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to send message' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

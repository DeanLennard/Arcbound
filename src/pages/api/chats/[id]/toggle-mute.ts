// src/pages/api/chats/[[id]]/toggle-mute.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await requireAuth(req, res);
    if (!session) return;

    const userId = session.user.id;
    const { id: chatId } = req.query;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMuted = user.mutedChats?.includes(chatId);

    if (isMuted) {
        user.mutedChats = user.mutedChats.filter((c: string) => c.toString() !== chatId);
    } else {
        user.mutedChats.push(chatId);
    }

    await user.save();

    return res.status(200).json({ muted: !isMuted });
}

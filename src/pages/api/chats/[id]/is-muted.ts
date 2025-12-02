// src/pages/api/chats/[[id]]/is-muted.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import type { Types } from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await requireAuth(req, res);
    if (!session) return;

    await dbConnect();
    const user = await User.findById(session.user.id).select('mutedChats');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const chatId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const isMuted = (user.mutedChats || [])
        .some((c: Types.ObjectId) => c.toString() === chatId);

    return res.status(200).json({ muted: isMuted });
}

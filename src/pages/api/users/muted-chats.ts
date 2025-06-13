// src/pages/api/users/muted-chats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import type { Types } from 'mongoose';            // ← import the ObjectId type

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await requireAuth(req, res);
    if (!session) return;

    await dbConnect();
    const user = await User.findById(session.user.id).select('mutedChats');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // give the callback a concrete type for "c"
    const chatIds = (user.mutedChats || []).map((c: Types.ObjectId) => c.toString());

    return res.status(200).json({ chatIds });
}

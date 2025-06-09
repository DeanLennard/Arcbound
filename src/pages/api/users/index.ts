import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        try {
            const users = await User.find({}, 'characterName profileImage _id').lean<{ _id: mongoose.Types.ObjectId; characterName: string; profileImage: string }[]>();
            // Optionally exclude the logged-in user:
            const filteredUsers = users.filter(u => u._id.toString() !== session.user.id);
            res.status(200).json({ users: filteredUsers });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

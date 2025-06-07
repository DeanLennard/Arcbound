// src/pages/api/users/me.ts
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const userId = session.user.id;

    if (req.method === 'GET') {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
        const { playerName, characterName, profileImage } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { playerName, characterName, profileImage },
            { new: true }
        );
        return res.status(200).json(user);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}

// /src/pages/api/users/[id].ts
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const user = await User.findById(id).lean();
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const { password, ...safeUser } = user;
            return res.status(200).json({ user: safeUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch user profile' });
        }
    }

    if (req.method === 'PUT') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        try {
            if (session.user.id !== id) {
                return res.status(403).json({ error: 'You can only edit your own profile' });
            }

            const { playerName, characterName, profileImage } = req.body;
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { playerName, characterName, profileImage },
                { new: true }
            ).lean();

            const { password, ...safeUser } = updatedUser;
            return res.status(200).json({ user: safeUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}

// src/pages/api/admin/users/[id]/role.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const { id } = req.query;

    if (req.method === 'PATCH') {
        const { newRole } = req.body;

        if (!['admin', 'moderator', 'member'].includes(newRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await dbConnect();

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.role = newRole;
        await user.save();

        return res.status(200).json({ message: 'User role updated successfully' });
    }

    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

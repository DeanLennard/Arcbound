// pages/api/chats/[id]/update.ts
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);
    if (!session || !['admin', 'member'].includes(session.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const updates: Partial<{ groupName: string; groupImage: string }> = {};
            if (req.body.groupName !== undefined) {
                updates.groupName = req.body.groupName;
            }
            if (req.body.groupImage !== undefined) {
                updates.groupImage = req.body.groupImage;
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid fields provided.' });
            }

            const updatedChat = await Chat.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true }
            );

            if (!updatedChat) {
                return res.status(404).json({ error: 'Chat not found.' });
            }

            return res.status(200).json({ chat: updatedChat });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update group.' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

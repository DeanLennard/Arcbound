// /src/pages/api/chats/[[id]]/leave.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import mongoose from 'mongoose';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Not authorized' });

    if (req.method === 'POST') {
        const chatId = req.query.id;
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) return res.status(404).json({ error: 'Chat not found' });

            // Remove user from group
            chat.members = chat.members.filter(
                (member: mongoose.Types.ObjectId) => member.toString() !== session.user.id
            );
            await chat.save();
            res.status(200).json({ message: 'Left group successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to leave group' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// src/pages/api/chats/[id]/add-member.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { Types } from 'mongoose';

interface PopulatedMember {
    _id: Types.ObjectId;
    characterName: string;
    profileImage?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid chat ID' });
    }

    if (req.method === 'POST') {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const chat = await Chat.findById(id).populate('members', '_id characterName profileImage');
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            if (!chat.isGroup) {
                return res.status(400).json({ error: 'Cannot add members to a direct message' });
            }

            // Check if requester is a member
            if (!chat.members.some((member: PopulatedMember) => member._id.toString() === session.user.id)) {
                return res.status(403).json({ error: 'You are not a member of this group' });
            }

            const userToAdd = await User.findById(userId);
            if (!userToAdd) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent adding the same member twice
            if (chat.members.some((member: PopulatedMember) => member._id.equals(userToAdd._id))) {
                return res.status(400).json({ error: 'User is already a member' });
            }

            chat.members.push(userToAdd._id);
            if (chat.members.length >= 3) {
                chat.isGroup = true;
                chat.groupName ||= 'Group Chat';
            }
            await chat.save();

            // Re-populate members to send updated data
            await chat.populate('members', '_id characterName profileImage');

            return res.status(200).json({ chat });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to add member' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

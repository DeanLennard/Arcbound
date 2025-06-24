// src/pages/api/admin/meetings/[id]/lock.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import MeetingRoom from '@/models/MeetingRoom';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await dbConnect();
    const { id } = req.query;
    if (Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    // Find room
    const room = await MeetingRoom.findById(id);
    if (!room) {
        return res.status(404).json({ error: 'Not found' });
    }

    // Toggle lock
    room.isLocked = !room.isLocked;
    await room.save();

    return res.status(200).json({ _id: room._id, isLocked: room.isLocked });
}

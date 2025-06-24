// src/pages/api/admin/meetings/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import MeetingRoom from '@/models/MeetingRoom';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { id } = req.query;

    // Make sure id is a string
    if (Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    switch (req.method) {
        case 'GET': {
            const room = await MeetingRoom.findById(id).lean();
            return room
                ? res.status(200).json(room)
                : res.status(404).json({ error: 'Not found' });
        }

        case 'PUT':  // or use PATCH if you prefer partial updates
        case 'PATCH': {
            try {
                const update = req.body;
                // Prevent unwanted fields:
                delete update._id;
                const room = await MeetingRoom.findByIdAndUpdate(id, update, { new: true });
                return room
                    ? res.status(200).json(room)
                    : res.status(404).json({ error: 'Not found' });
            } catch (err: any) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
        }

        case 'DELETE': {
            const room = await MeetingRoom.findByIdAndDelete(id);
            return room
                ? res.status(200).json({ deleted: true })
                : res.status(404).json({ error: 'Not found' });
        }

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// src/pages/api/admin/meetings/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import MeetingRoom from '@/models/MeetingRoom';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    switch (req.method) {
        case 'GET': {
            // (Optional) return all rooms
            const rooms = await MeetingRoom.find().lean();
            return res.status(200).json(rooms);
        }

        case 'POST': {
            try {
                const {
                    name,
                    hostId,
                    coHostIds = [],
                    allowGuests = true,
                    enableBreakouts = true,
                    enableRecording = false,
                    enablePolls = true,
                    enableQA = true,
                    scheduledStart,
                    durationMinutes = 60,
                } = req.body;

                if (!name || !hostId) {
                    return res.status(400).json({ error: 'Missing required fields: name and hostId' });
                }

                const newRoom = await MeetingRoom.create({
                    name,
                    hostId,
                    coHostIds,
                    allowGuests,
                    settings: {
                        enableBreakouts,
                        enableRecording,
                        enablePolls,
                        enableQA,
                    },
                    participantCount: 0,
                    scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
                    durationMinutes,
                });

                return res.status(201).json(newRoom);
            } catch (err: any) {
                console.error('Error creating meeting room:', err);
                return res.status(500).json({ error: err.message || 'Internal server error' });
            }
        }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

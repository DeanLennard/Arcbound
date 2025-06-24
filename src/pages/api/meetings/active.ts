// src/pages/api/meetings/active.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb'
import MeetingRoom from '@/models/MeetingRoom';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1) ensure we’re connected
    await dbConnect();

    // 2) now it’s safe to query
    const active = await MeetingRoom.find({
        isLocked: false,
        // endTime: { $gt: new Date() } // if you track an end-time
    })
        .select('name _id participantCount')
        .lean();

    res.status(200).json(active);
}

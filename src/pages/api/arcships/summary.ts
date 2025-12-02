// pages/api/arcships/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect }                          from '@/lib/mongodb';
import Arcship                                from '@/models/Arcship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // fetch only [id]+name for each arcship
    const ships = await Arcship.find()
        .select('_id name')
        .lean();

    return res.status(200).json(ships);
}

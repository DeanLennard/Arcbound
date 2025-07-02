// src/pages/api/arcships/with-sector.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Arcship from '@/models/Arcship';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // find all arcships where xSector and ySector are set
    const ships = await Arcship.find(
        {
            // require both coordinates to exist
            xSector: { $exists: true, $ne: null },
            ySector: { $exists: true, $ne: null },
            isCloaked: { $ne: true },
        },
        {
            // projection: include only name, xSector, ySector
            name: 1,
            xSector: 1,
            ySector: 1,
            flagUrl:  1,
        }
    ).lean();

    // return as JSON
    return res.status(200).json(ships);
}

// src/pages/api/sectors/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Sector, { SectorDoc } from '@/models/Sector';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();

    if (req.method === 'GET') {
        const sectors = await Sector.find().lean<SectorDoc>();
        return res.status(200).json(sectors);
    }

    if (req.method === 'POST') {
        const { name, x, y, control, hasMission } = req.body;
        if (
            typeof name !== 'string' ||
            typeof x !== 'number' ||
            typeof y !== 'number' ||
            typeof control !== 'string' ||
            typeof hasMission !== 'boolean'
        ) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        const newSector = await Sector.create({ name, x, y, control, hasMission });
        return res.status(201).json(newSector);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

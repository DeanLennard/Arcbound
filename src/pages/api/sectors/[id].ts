// src/pages/api/sectors/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Sector, { SectorDoc } from '@/models/Sector';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (req.method === 'PUT') {
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
        const updated = await Sector.findByIdAndUpdate(
            id,
            { name, x, y, control, hasMission },
            { new: true }
        ).lean<SectorDoc>();
        if (!updated) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
        await Sector.findByIdAndDelete(id);
        return res.status(204).end();
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

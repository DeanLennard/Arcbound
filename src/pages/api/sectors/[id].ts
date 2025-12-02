// src/pages/api/sectors/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Sector from '@/models/Sector';
import '@/models/Effect';

type SectorUpdate = Partial<{
    name: string;
    x: number;
    y: number;
    control: string;
    hasMission: boolean;
    effects: string[]; // IDs only
}>;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect();
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    // ---------------------------------------
    // GET — Return the sector + (populated) effects
    // ---------------------------------------
    if (req.method === 'GET') {
        const sector = await Sector.findById(id)
            .populate('effects')
            .lean();

        if (!sector) return res.status(404).json({ error: 'Not found' });

        return res.status(200).json(sector);
    }

    // ---------------------------------------
    // PUT — Update sector base fields + optional effects
    // ---------------------------------------
    if (req.method === 'PUT') {
        const { name, x, y, control, hasMission, effects } = req.body;

        const update: SectorUpdate = {};

        // Normal fields (existing behaviour)
        if (typeof name === 'string') update.name = name;
        if (typeof x === 'number') update.x = x;
        if (typeof y === 'number') update.y = y;
        if (typeof control === 'string') update.control = control;
        if (typeof hasMission === 'boolean') update.hasMission = hasMission;

        // New feature: Effects
        if (Array.isArray(effects)) {
            update.effects = effects;
        }

        const updated = await Sector.findByIdAndUpdate(id, update, { new: true })
            .lean();

        if (!updated) return res.status(404).json({ error: 'Not found' });

        return res.status(200).json(updated);
    }

    // ---------------------------------------
    // DELETE — unchanged
    // ---------------------------------------
    if (req.method === 'DELETE') {
        await Sector.findByIdAndDelete(id);
        return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// src/pages/api/sectors/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose, {UpdateQuery} from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Sector, { SectorDoc } from '@/models/Sector';
import SectorEffect from "@/models/SectorEffect";

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
        const { addEffect, removeEffect, ...rest } = req.body;

        // Strong typing: update only fields that genuinely exist on SectorDoc
        const update: UpdateQuery<SectorDoc> = {};

        // Assign only known, allowed fields
        if (typeof rest.name === 'string') update.name = rest.name;
        if (typeof rest.x === 'number') update.x = rest.x;
        if (typeof rest.y === 'number') update.y = rest.y;
        if (typeof rest.control === 'string') update.control = rest.control;
        if (typeof rest.hasMission === 'boolean') update.hasMission = rest.hasMission;

        // ---- Add effect ----
        if (typeof addEffect === 'string') {
            await Sector.findByIdAndUpdate(id, {
                $addToSet: { effects: addEffect }
            });

            await SectorEffect.findByIdAndUpdate(addEffect, {
                $addToSet: { sectors: id }
            });
        }

        // ---- Remove effect ----
        if (typeof removeEffect === 'string') {
            await Sector.findByIdAndUpdate(id, {
                $pull: { effects: removeEffect }
            });

            await SectorEffect.findByIdAndUpdate(removeEffect, {
                $pull: { sectors: id }
            });
        }

        // Apply normal updates
        const updated = await Sector.findByIdAndUpdate(id, update, { new: true })
            .populate('effects')
            .lean();

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

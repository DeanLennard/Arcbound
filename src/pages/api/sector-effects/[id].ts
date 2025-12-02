// pages/api/sector-effects/[id].ts
import { dbConnect } from '@/lib/mongodb';
import SectorEffect from '@/models/SectorEffect';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { id } = req.query;

    if (req.method === 'DELETE') {
        await SectorEffect.findByIdAndDelete(id);
        return res.status(204).end();
    }

    if (req.method === 'PUT') {
        const updated = await SectorEffect.findByIdAndUpdate(id, req.body, { new: true }).lean();
        return res.status(200).json(updated);
    }

    res.setHeader('Allow', ['PUT','DELETE']);
    res.status(405).end();
}

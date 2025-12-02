// pages/api/sector-effects/index.ts
import { dbConnect } from '@/lib/mongodb';
import SectorEffect from '@/models/SectorEffect';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        const { sector } = req.query;
        const filter = sector ? { sectors: sector } : {};
        const fx = await SectorEffect.find(filter).lean();
        return res.status(200).json(fx);
    }

    if (req.method === 'POST') {
        const created = await SectorEffect.create(req.body);
        return res.status(201).json(created);
    }

    res.setHeader('Allow', ['GET','POST']);
    res.status(405).end();
}

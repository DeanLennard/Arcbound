// src/pages/api/modules/[id]/use-charge.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Module from '@/models/Module';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

    await dbConnect();

    const { id } = req.query;

    const mod = await Module.findById(id);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    if (!mod.maxCharges || mod.maxCharges <= 0)
        return res.status(400).json({ error: 'Module has no charges' });

    if (mod.charges === 0)
        return res.status(400).json({ error: 'No charges left' });

    mod.charges = (mod.charges ?? 0) - 1;
    await mod.save();

    return res.json({ charges: mod.charges });
}

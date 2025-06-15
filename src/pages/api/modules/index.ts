// pages/api/modules/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect }         from '@/lib/mongodb';
import Module               from '@/models/Module';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        // list only those attached to a particular ship:
        const { attachedTo } = req.query;
        const filter: any = {};
        if (attachedTo) filter.attachedTo = attachedTo === 'null' ? null : attachedTo;
        const mods = await Module.find(filter).lean();
        return res.status(200).json(mods);
    }

    if (req.method === 'POST') {
        // expects { name, description, state, cost, prereqs, attachedTo }
        const created = await Module.create(req.body);
        return res.status(201).json(created);
    }

    res.setHeader('Allow', ['GET','POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// pages/api/arcships/[[id]].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {dbConnect} from '@/lib/mongodb';
import Arcship from '@/models/Arcship';
import '@/models/Character';
import '@/models/Module';
import '@/models/Diplomacy';
import '@/models/Effect';
import '@/models/EventLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    await dbConnect();

    const ship = await Arcship.findById(id)
        .populate('modules diplomacy effects commanders prevCommanders eventLog')
        .lean();
    if (!ship) return res.status(404).json({ error: 'Not found' });

    switch (req.method) {
        case 'GET':
            return res.status(200).json(ship);

        case 'PUT': {
            const updated = await Arcship.findByIdAndUpdate(id, req.body, { new: true }).lean();
            return res.status(200).json(updated);
        }

        case 'DELETE':
            await Arcship.findByIdAndDelete(id);
            return res.status(204).end();

        default:
            res.setHeader('Allow', ['GET','PUT','DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

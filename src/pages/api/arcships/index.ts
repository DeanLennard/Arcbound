// pages/api/arcships/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {dbConnect} from '@/lib/mongodb';
import '@/models/Module';
import '@/models/Diplomacy';
import '@/models/Effect';
import '@/models/EventLog';
import '@/models/Character';
import Arcship from '@/models/Arcship';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    switch (req.method) {
        case 'GET': {
            const ships = await Arcship.find()
                .populate('modules diplomacy effects commanders prevCommanders eventLog')
                .lean();
            return res.status(200).json(ships);
        }
        case 'POST': {
            const data = req.body;
            const created = await Arcship.create(data);
            return res.status(201).json(created);
        }
        default:
            res.setHeader('Allow', ['GET','POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

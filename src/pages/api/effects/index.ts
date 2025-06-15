// pages/api/effects/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Effect from '@/models/Effect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    switch (req.method) {
        case 'GET': {
            const { ship } = req.query;
            const filter: any = {};
            if (ship && ship !== 'null') filter.ships = ship;   // matches array membership
            const effects = await Effect.find(filter).lean();
            return res.status(200).json(effects);
        }
        case 'POST': {
            // expect { name, description, kind, ships: [<id>] }
            const created = await Effect.create(req.body);
            return res.status(201).json(created);
        }
        default:
            res.setHeader('Allow', ['GET','POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// pages/api/diplomacy/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Diplomacy from '@/models/Diplomacy'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    switch (req.method) {
        case 'GET': {
            const { ship } = req.query
            const filter: any = {}
            if (ship && ship !== 'null') {
                filter.ships = ship
            }
            // populate the ships array so we get back [{ _id, name }, …]
            const arr = await Diplomacy.find(filter)
                .populate('ships', 'name')
                .lean()
            return res.status(200).json(arr)
        }
        case 'POST': {
            const created = await Diplomacy.create(req.body)
            return res.status(201).json(created)
        }
        default:
            res.setHeader('Allow', ['GET','POST'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

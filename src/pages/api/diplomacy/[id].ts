// pages/api/diplomacy/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Diplomacy from '@/models/Diplomacy'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'PUT': {
            // expects { ships: { add?: string, remove?: string } }
            const { ships } = req.body
            const update: any = {}
            if (ships?.add)    update.$addToSet = { ships: ships.add }
            if (ships?.remove) update.$pull     = { ships: ships.remove }

            const updated = await Diplomacy.findByIdAndUpdate(id, update, { new: true }).lean()
            res.status(200).json(updated)  // <- call json(), don’t return it
            return                         // <- then exit
        }

        case 'DELETE': {
            await Diplomacy.findByIdAndDelete(id)
            res.status(204).end()          // <- call end(), don’t return it
            return
        }

        default:
            res.setHeader('Allow', ['PUT','DELETE'])
            res.status(405).end(`Method ${req.method} Not Allowed`)
            return
    }
}

// pages/api/diplomacy/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                           from '@/lib/mongodb'
import Diplomacy, { type DiplomacyDoc }        from '@/models/Diplomacy'
import type { UpdateQuery }                    from 'mongoose'

interface ShipsPayload {
    add?: string
    remove?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // normalize id to a string
    const rawId = req.query.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    await dbConnect()

    switch (req.method) {
        case 'PUT': {
            // explicitly type what you expect in the body
            const { ships }: { ships?: ShipsPayload } = req.body

            // use UpdateQuery<DiplomacyDoc> instead of `any`
            const update: UpdateQuery<DiplomacyDoc> = {}

            if (ships?.add) {
                update.$addToSet = { ships: ships.add }
            }
            if (ships?.remove) {
                update.$pull = { ships: ships.remove }
            }

            const updated = await Diplomacy
                .findByIdAndUpdate(id, update, { new: true })
                .lean()
            return res.status(200).json(updated)
        }

        case 'DELETE': {
            await Diplomacy.findByIdAndDelete(id)
            return res.status(204).end()
        }

        default:
            res.setHeader('Allow', ['PUT', 'DELETE'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

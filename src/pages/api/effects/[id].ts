// pages/api/effects/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                           from '@/lib/mongodb'
import Effect, { type EffectDoc }              from '@/models/Effect'
import type { UpdateQuery }                    from 'mongoose'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query
    await dbConnect()

    if (req.method === 'PUT') {
        const { ships } = req.body

        // use UpdateQuery<EffectDoc> instead of `any`
        const update: UpdateQuery<EffectDoc> = {}

        if (ships?.add)    update.$addToSet = { ships: ships.add }
        if (ships?.remove) update.$pull     = { ships: ships.remove }

        const updated = await Effect
            .findByIdAndUpdate(id, update, { new: true })
            .lean()

        return res.status(200).json(updated)
    }

    res.setHeader('Allow', ['PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

// pages/api/diplomacy/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                           from '@/lib/mongodb'
import Diplomacy, { type DiplomacyDoc }        from '@/models/Diplomacy'
import mongoose from 'mongoose'
import type { UpdateQuery }                    from 'mongoose'

interface ShipsPayload {
    add?:    string
    remove?: string
}
/**
 * If the client sends `ships` as an array, we'll $set the entire array;
 * otherwise if it sends { ships: { add, remove } } we'll treat it as before.
 */
type PutBody = {
    name?: string
    description?: string
    type?: DiplomacyDoc['type']
    level?: DiplomacyDoc['level']
    ships?: string[] | ShipsPayload
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // normalize id to a string
    const rawId = req.query.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    await dbConnect()

    if (req.method === 'PUT') {
        const body = req.body as PutBody
        const update: UpdateQuery<DiplomacyDoc> = {}

        // always allow updating the core fields
        const setFields: Partial<DiplomacyDoc> = {}
        if (body.name        !== undefined) setFields.name        = body.name
        if (body.description !== undefined) setFields.description = body.description
        if (body.type        !== undefined) setFields.type        = body.type
        if (body.level       !== undefined) setFields.level       = body.level

        // handle ships
        if (Array.isArray(body.ships)) {
            // convert string[] → ObjectId[]
            setFields.ships = body.ships.map(idStr =>
                new mongoose.Types.ObjectId(idStr)
            )
        } else if (body.ships) {
            if (body.ships.add)    update.$addToSet = { ships: body.ships.add }
            if (body.ships.remove) update.$pull     = { ships: body.ships.remove }
        }

        if (Object.keys(setFields).length) {
            update.$set = { ...(update.$set ?? {}), ...setFields }
        }

        const updated = await Diplomacy
            .findByIdAndUpdate(id, update, { new: true })
            .lean()

        if (!updated) {
            return res.status(404).json({ error: 'Diplomacy record not found' })
        }
        return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
        await Diplomacy.findByIdAndDelete(id)
        return res.status(204).end()
    }

    res.setHeader('Allow', ['PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

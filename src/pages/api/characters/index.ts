// pages/api/characters/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                   from '@/lib/mongodb'
import Character                       from '@/models/Character'
// side-effect imports so Mongoose knows about all your schemas
import '@/models/User'
import '@/models/Arcship'
import '@/models/Item'
import '@/models/Shard'
import '@/models/Resistance'
import '@/models/Weakness'
import '@/models/OtherEffect'
import '@/models/Implant'
import '@/models/Ritual'
import '@/models/Scrap'
import '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    switch (req.method) {
        case 'GET': {
            const chars = await Character.find()
                // bring in only the playerName from the linked User
                .populate({ path: 'user', select: 'playerName' })
                // all your other populates...
                .populate('arcship items shards resistances weaknesses otherEffects implants rituals scrap phases')
                .lean()
            return res.status(200).json(chars)
        }

        case 'POST': {
            const created = await Character.create(req.body)
            return res.status(201).json(created)
        }

        default:
            res.setHeader('Allow', ['GET','POST'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

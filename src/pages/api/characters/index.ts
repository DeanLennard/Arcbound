// pages/api/characters/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                         from '@/lib/mongodb'
import Character                             from '@/models/Character'
import type { CharacterDocument }            from '@/models/Character'
import type { FilterQuery }                  from 'mongoose'
// ensure Mongoose knows about all your schemas
import '@/models/User'
import '@/models/Arcship'
import '@/models/CharacterAsset'
import '@/models/Phase'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect()

    switch (req.method) {
        case 'GET': {
            // pull `status` off the querystring, e.g. /api/characters?status=Active
            const { status } = req.query

            // use a typed FilterQuery instead of `any`
            const filter: FilterQuery<CharacterDocument> = {}

            if (status) {
                // if somebody does ?status=Active (or ?status=Active&status=Dead)
                // we just take the first and filter on it
                const s = Array.isArray(status) ? status[0] : status
                filter.status = s as CharacterDocument['status']
            }

            const chars = await Character.find(filter)
                .populate({ path: 'user', select: 'playerName' })
                .populate('arcship phases')
                .lean()

            return res.status(200).json(chars)
        }

        case 'POST': {
            const created = await Character.create(req.body)
            return res.status(201).json(created)
        }

        default:
            res.setHeader('Allow', ['GET', 'POST'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

// pages/api/reports/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Character from '@/models/Character'
import Phase from '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    // 1) Character‐based spreads
    const [
        factionBuckets,
        roleBuckets,
        archetypeBuckets,
        raceBuckets,
    ] = await Promise.all([
        Character.aggregate([
            { $group: { _id: '$faction', count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $group: { _id: '$archetype', count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $group: { _id: '$race', count: { $sum: 1 } } }
        ]),
    ])

    // 2) Protocol‐used per phase
    const protocolByPhase = await Phase.aggregate([
        // only those where interaction mentions “protocol used”
        { $match: { interaction: /protocol used/i } },
        { $group: { _id: '$number', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ])

    res.status(200).json({
        factionSpread:    factionBuckets,
        roleSpread:       roleBuckets,
        archetypeSpread:  archetypeBuckets,
        raceSpread:       raceBuckets,
        protocolByPhase,
    })
}

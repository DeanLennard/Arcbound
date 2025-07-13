// pages/api/reports/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }           from '@/lib/mongodb'
import Character               from '@/models/Character'
import Phase                   from '@/models/Phase'
import GamePhase               from '@/models/GamePhase'

export interface PendingChar {
    _id:      string
    charName: string
    faction:  string
    role:     string
    race:     string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    // 1) Character‐based spreads (only non-NPCs)
    const [
        factionBuckets,
        roleBuckets,
        archetypeBuckets,
        raceBuckets
    ] = await Promise.all([
        Character.aggregate([
            { $match: { npc: false } },
            { $group: { _id: '$faction',    count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $match: { npc: false } },
            { $group: { _id: '$role',       count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $match: { npc: false } },
            { $group: { _id: '$archetype',  count: { $sum: 1 } } }
        ]),
        Character.aggregate([
            { $match: { npc: false } },
            { $group: { _id: '$race',       count: { $sum: 1 } } }
        ])
    ])

    const protocolByPhase = await Phase.aggregate([
        { $match: { interaction: /protocol used/i } },
        { $group: { _id: '$number', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ])

    // --- 2) figure out current open phase ---
    const current = await GamePhase.findOne({ isOpen: true }).lean<{ phase: number }>();
    const phaseNum = current?.phase ?? null;

    // build pendingProtocols in one go
    const pendingProtocols: PendingChar[] = phaseNum === null
        ? []
        : await Character
            .find(
                { _id: { $nin: await Phase.distinct('character', {
                            number: phaseNum,
                            interaction: /protocol used/i
                        })
                    },
                    status: 'Active',
                    npc:    false
                },
                { charName: 1, faction: 1, role: 1, race: 1, _id: 1 }
            )
            .lean<PendingChar[]>()

    return res.status(200).json({
        factionSpread:    factionBuckets,
        roleSpread:       roleBuckets,
        archetypeSpread:  archetypeBuckets,
        raceSpread:       raceBuckets,
        protocolByPhase,
        pendingProtocols
    });
}

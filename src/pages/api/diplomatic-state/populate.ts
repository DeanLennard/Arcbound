// pages/api/diplomatic-state/populate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                 from '@/lib/mongodb'
import DiplomaticState, { FactionName } from '@/models/DiplomaticState'

const ALL_FACTIONS: FactionName[] = [
    'The Virean Ascendancy', 'The Aeon Collective', 'The Sundered Concord',
    'The Helion Federation', 'The Korveth Dominion', 'The Tyr Solaris Imperium',
    'The Hollow Pact', 'The Threadkeepers of Luvenn', 'The Second Spiral',
    'House Ziralex', 'The Ninefold Choir', 'The Unmade'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    if (req.method !== 'POST') return res.status(405).end()

    const { phase } = req.body as { phase: number }

    // Only generate one side of each pair: source < target
    const pairs = ALL_FACTIONS.flatMap(source =>
        ALL_FACTIONS
            .filter(target => target > source)      // enforce source < target
            .map(target => ({
                phase,
                source,
                target,
                stance:   'Neutral' as const,
                progress: 0,
            }))
    )

    await DiplomaticState.insertMany(pairs, { ordered: false })
        .catch(() => { /* ignore duplicate‐key errors */ })

    res.status(201).json({ message: 'Populated only one direction per pair' })
}

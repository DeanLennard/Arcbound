// pages/api/diplomatic-state/populate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import DiplomaticState, { FactionName } from '@/models/DiplomaticState'
import type { AnyBulkWriteOperation } from 'mongoose'

const ALL_FACTIONS: FactionName[] = [
    'The Virean Ascendancy', 'The Aeon Collective', 'The Sundered Concord',
    'The Helion Federation', 'The Korveth Dominion', 'The Tyr Solaris Imperium',
    'The Hollow Pact', 'The Threadkeepers of Luvenn', 'The Second Spiral',
    'House Ziralex', 'The Ninefold Choir', 'The Unmade'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    if (req.method !== 'POST') return res.status(405).end()

    const { fromPhase: incomingFrom, toPhase: incomingTo } =
        req.body as { fromPhase?: number | null; toPhase?: number | null }

    // compute the highest existing phase
    const lastDoc = await DiplomaticState.findOne().sort({ phase: -1 }).lean<{ phase: number }>()
    const maxPhase = lastDoc?.phase ?? 0

    // determine fromPhase and toPhase
    const fromPhase = (typeof incomingFrom === 'number' && incomingFrom > 0)
        ? incomingFrom
        : maxPhase // default to current max (copy latest)
    const toPhase = (typeof incomingTo === 'number' && incomingTo > 0)
        ? incomingTo
        : (fromPhase > 0 ? fromPhase + 1 : maxPhase + 1)

    // fetch source records (if any)
    const sourceRecords = await DiplomaticState.find({ phase: fromPhase }).lean()

    // if there are records on the source phase, copy them; otherwise generate neutral defaults
    const docsToInsertOrUpsert = (sourceRecords && sourceRecords.length > 0)
        ? sourceRecords.map(r => ({
            phase: toPhase,
            source: r.source,
            target: r.target,
            stance: r.stance,
            progress: r.progress
        }))
        : ALL_FACTIONS.flatMap(source =>
            ALL_FACTIONS
                .filter(target => target > source)
                .map(target => ({
                    phase: toPhase,
                    source,
                    target,
                    stance: 'Neutral' as const,
                    progress: 0
                }))
        )

    // Prepare bulk upserts: set stance/progress for (phase,toPhase,source,target)
    const ops: AnyBulkWriteOperation[] = docsToInsertOrUpsert.map(d => ({
        updateOne: {
            filter: { phase: toPhase, source: d.source, target: d.target },
            update: { $set: { stance: d.stance, progress: d.progress } },
            upsert: true
        }
    }))

    try {
        if (ops.length) {
            await DiplomaticState.bulkWrite(ops, { ordered: false })
        }
        return res.status(201).json({ message: 'Populated phase', fromPhase, toPhase })
    } catch (err) {
        console.error('Populate error', err)
        return res.status(500).json({ error: 'Failed to populate phase' })
    }
}

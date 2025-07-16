// pages/api/diplomatic-state/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                            from '@/lib/mongodb'
import DiplomaticState, { FactionName, Stance }  from '@/models/DiplomaticState'
import GamePhase                                 from '@/models/GamePhase'
import type { AnyBulkWriteOperation }               from 'mongoose'

interface RelationRecord {
    phase:    number
    source:   FactionName
    target:   FactionName
    stance:   Stance
    progress: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            // 1) load the “open” phase (the max) once:
            const open = await GamePhase
                .findOne({ isOpen: true })
                .lean<{ phase: number }>()
            const maxPhase = open?.phase ?? 1

            // 2) figure out which phase to show records for
            let phaseNum: number
            if (req.query.phase) {
                phaseNum = parseInt(
                    Array.isArray(req.query.phase) ? req.query.phase[0] : req.query.phase,
                    10
                )
            } else {
                phaseNum = maxPhase
            }

            // 3) build the dropdown as [1, …, maxPhase]
            const allPhases = Array.from({ length: maxPhase }, (_, i) => i + 1)

            // 4) fetch only that phase’s rows
            const records = await DiplomaticState.find({ phase: phaseNum }).lean<RelationRecord[]>()

            return res.status(200).json({
                phase:    phaseNum,
                allPhases,
                records
            })

        case 'POST':
            const { phase, updates } = req.body as {
                phase:   number
                updates: Pick<RelationRecord,'source'|'target'|'stance'|'progress'>[]
            }
            if (typeof phase !== 'number' || !Array.isArray(updates)) {
                return res.status(400).json({ error: 'Invalid payload' })
            }
            const ops: AnyBulkWriteOperation[] = updates.map(u => ({
                updateOne: {
                    filter: { phase, source: u.source, target: u.target },
                    update: { $set: { stance: u.stance, progress: u.progress } },
                    upsert: true
                }
            }))
            await DiplomaticState.bulkWrite(ops)
            return res.status(204).end()

        default:
            res.setHeader('Allow', ['GET','POST'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

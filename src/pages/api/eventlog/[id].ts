// pages/api/eventlog/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import EventLog, { type EventLogDoc } from '@/models/EventLog'
import type { UpdateQuery } from 'mongoose'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id: rawId } = req.query
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    await dbConnect()

    switch (req.method) {
        case 'PUT': {
            // Expect full update payload
            const { eventName, effect, phase, level, ongoing, arcship } = req.body
            const update: UpdateQuery<EventLogDoc> = {}
            const setFields: Partial<EventLogDoc> = {}
            if (eventName !== undefined) setFields.eventName = eventName
            if (effect    !== undefined) setFields.effect    = effect
            if (phase     !== undefined) setFields.phase     = phase
            if (level     !== undefined) setFields.level     = level
            if (ongoing   !== undefined) setFields.ongoing   = ongoing
            if (arcship   !== undefined) setFields.arcship   = arcship
            if (Object.keys(setFields).length) {
                update.$set = setFields
            }

            const updated = await EventLog.findByIdAndUpdate(id, update, { new: true }).lean()
            if (!updated) {
                return res.status(404).json({ error: 'Event log not found' })
            }
            return res.status(200).json(updated)
        }

        case 'DELETE': {
            await EventLog.findByIdAndDelete(id)
            return res.status(204).end()
        }

        default:
            res.setHeader('Allow', ['PUT','DELETE'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
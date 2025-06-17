// pages/api/eventlog/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                        from '@/lib/mongodb'
import EventLog, { type EventLogDoc }       from '@/models/EventLog'
import type { FilterQuery }                 from 'mongoose'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect()

    if (req.method === 'GET') {
        const { arcship } = req.query

        // use a strongly-typed FilterQuery instead of `any`
        const filter: FilterQuery<EventLogDoc> = {}
        if (typeof arcship === 'string') {
            filter.arcship = arcship
        }

        const logs = await EventLog.find(filter).lean()
        return res.status(200).json(logs)
    }

    if (req.method === 'POST') {
        const created = await EventLog.create(req.body)
        return res.status(201).json(created)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

// pages/api/eventlog/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import EventLog from '@/models/EventLog'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    await dbConnect()

    if (req.method === 'DELETE') {
        await EventLog.findByIdAndDelete(id)
        return res.status(204).end()
    }

    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

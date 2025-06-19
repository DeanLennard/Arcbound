// pages/api/effects/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Effect from '@/models/Effect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    await dbConnect()

    if (req.method === 'PUT') {
        const { name, description, kind, level } = req.body

        const updated = await Effect
            .findByIdAndUpdate(
                id,
                { name, description, kind, level },    // <-- sets these fields
                { new: true }
            )
            .lean()

        if (!updated) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
        const deleted = await Effect
            .findByIdAndDelete(id)
            .lean()

        if (!deleted) {
            return res.status(404).json({ error: 'Effect not found' })
        }

        // Successful deletion, no content
        return res.status(204).end()
    }

    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}

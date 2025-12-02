// pages/api/phases/[[id]].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Phase from '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    const { id } = req.query

    if (req.method === 'PUT') {
        const updated = await Phase.findByIdAndUpdate(id, req.body, { new: true }).lean()
        if (!updated) return res.status(404).end()
        return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
        await Phase.findByIdAndDelete(id)
        return res.status(204).end()
    }

    res.setHeader('Allow', ['PUT','DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}

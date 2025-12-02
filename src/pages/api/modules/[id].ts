// pages/api/modules/[[id]].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Module from '@/models/Module'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'GET': {
            const mod = await Module.findById(id).lean()
            if (!mod) return res.status(404).end()
            return res.status(200).json(mod)
        }
        case 'PUT': {
            // e.g. { attachedTo: null } or { attachedTo: arcshipId }
            const updated = await Module.findByIdAndUpdate(id, req.body, { new: true }).lean()
            return res.status(200).json(updated)
        }
        case 'DELETE': {
            await Module.findByIdAndDelete(id)
            return res.status(204).end()
        }
        default:
            res.setHeader('Allow', ['GET','PUT','DELETE'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

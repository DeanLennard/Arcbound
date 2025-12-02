// pages/api/characters/[[id]]/phases.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Phase from '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const characterId = req.query.id as string
    await dbConnect()

    if (req.method === 'GET') {
        const list = await Phase.find({ character: characterId })
            .sort({ number: 1 })
            .lean()
        return res.status(200).json(list)
    }

    if (req.method === 'POST') {
        const created = await Phase.create({ ...req.body, character: characterId })
        return res.status(201).json(created)
    }

    res.setHeader('Allow', ['GET','POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

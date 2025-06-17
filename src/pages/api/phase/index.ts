// pages/api/phase/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Phase from '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    if (req.method === 'POST') {
        const created = await Phase.create(req.body)
        return res.status(201).json(created)
    }
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}

// pages/api/characters/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                         from '@/lib/mongodb'
import Character                             from '@/models/Character'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    const chars = await Character.find({ status: 'Active' })
        .select('_id charName')
        .lean()
    return res.status(200).json(chars)
}

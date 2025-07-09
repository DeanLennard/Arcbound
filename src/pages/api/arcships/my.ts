// pages/api/arcships/my.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Character from '@/models/Character'
import Arcship from '@/models/Arcship'

export interface ShipSummary {
    _id: string
    name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    await dbConnect()

    // 1️⃣ load all *active* characters for this user,
    //    picking up both `arcship` and `AdditionalArcships`
    const myChars = await Character
        .find({ user: session.user.id, status: 'Active' })
        .select('arcship AdditionalArcships')
        .sort({ name: 1 })
        .lean()

    // 2️⃣ collect all IDs (primary + extras)
    const allIds = new Set<string>()
    myChars.forEach(c => {
        if (c.arcship) allIds.add(c.arcship.toString())
        if (Array.isArray(c.AdditionalArcships)) {
            c.AdditionalArcships.forEach(x => allIds.add(x.toString()))
        }
    })

    // 3️⃣ fetch them in one go
    const ships = await Arcship
        .find({ _id: { $in: Array.from(allIds) } })
        .select('_id name')
        .lean<ShipSummary[]>()

    return res.status(200).json(ships)
}

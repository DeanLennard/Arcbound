// pages/api/arcships/my.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Character from '@/models/Character'
import Arcship   from '@/models/Arcship'

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

    // 1) load all my *active* characters
    const myChars = await Character
        .find({ user: session.user.id, status: 'Active' })
        .select('arcship')
        .lean()

    // 2) pull out all non-null arcship IDs
    const shipIds = Array.from(new Set(
        myChars
            .map(c => c.arcship?.toString())
            .filter(Boolean) as string[]
    ))

    // 3) fetch those ships
    const ships = await Arcship
        .find({ _id: { $in: shipIds } })
        .select('_id name')
        .lean()

    return res.status(200).json(ships)
}

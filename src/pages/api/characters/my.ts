// pages/api/characters/my.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession }               from 'next-auth'
import authOptions                        from '@/lib/authOptions'
import { dbConnect }                      from '@/lib/mongodb'
import Character                          from '@/models/Character'

export interface CharacterSummary {
    _id:      string
    charName: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CharacterSummary[] | { error: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).json({ error: 'Not authenticated' })

    await dbConnect()
    const chars = await Character
        .find({ user: session.user.id, status: 'Active' })
        .select('_id charName')
        .lean<CharacterSummary[]>()

    return res.status(200).json(chars)
}

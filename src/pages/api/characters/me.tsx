// pages/api/characters/me.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession }                  from 'next-auth'
import authOptions                           from '@/lib/authOptions'
import { dbConnect }                         from '@/lib/mongodb'
import Character                             from '@/models/Character'
import '@/models/User'    // ensure the User schema is registered
import '@/models/Arcship'
import '@/models/CharacterAsset'
import '@/models/Phase'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // only support GET here
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    // get the logged-in user
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        // not logged in
        return res.status(401).json(null)
    }

    await dbConnect()

    // find *one* active character for this user
    const activeChar = await Character
        .findOne({ user: session.user.id, status: 'Active' })
        .lean()

    // return either the character doc or null
    return res.status(200).json(activeChar || null)
}

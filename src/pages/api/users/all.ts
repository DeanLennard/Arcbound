// src/pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    const session = await requireAuth(req, res)
    if (!session) return

    if (req.method === 'GET') {
        try {
            // grab both playerName and characterName
            const users = await User
                .find({}, 'playerName characterName profileImage _id')
                .lean<{
                    _id: mongoose.Types.ObjectId
                    playerName?: string
                    characterName?: string
                    profileImage?: string
                }[]>()

            // fill in characterName if missing
            const shaped = users.map(u => ({
                _id:           u._id.toString(),
                playerName:   u.playerName || '',
                characterName: u.characterName && u.characterName.trim().length
                    ? u.characterName
                    : u.playerName ?? '— no name —',
                profileImage: u.profileImage || ''
            }))

            return res.status(200).json({ users: shaped })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ error: 'Failed to fetch users' })
        }
    }

    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}

// src/pages/api/chats/[[id]]/remove-member.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession }               from 'next-auth/next'
import authOptions                        from '@/lib/authOptions'
import { dbConnect }                      from '@/lib/mongodb'
import Chat                               from '@/models/Chat'
import type { Types }                     from 'mongoose'

interface PopulatedMember {
    _id: Types.ObjectId
    characterName: string
    profileImage?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1) Auth
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    // 2) Only POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    await dbConnect()

    // 3) Payload
    const { id }     = req.query
    const { userId } = req.body
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' })
    }

    // 4) Load & guard
    //    ↳ populate members in one go and tell TS they’re PopulatedMember[]
    const chat = await Chat.findById(id)
        .populate<{ members: PopulatedMember[] }>(
            'members',
            'characterName profileImage'
        )

    if (!chat || !chat.isGroup) {
        return res.status(404).json({ error: 'Chat not found or not a group' })
    }

    // 5) Permission
    const memberIds = (chat.members as PopulatedMember[])
        .map((m) => m._id.toString())

    if (
        session.user.role !== 'admin' &&
        !memberIds.includes(session.user.id)
    ) {
        return res.status(403).json({ error: 'Not allowed' })
    }

    // 6) Remove & save
    chat.members = (chat.members as PopulatedMember[])
        .filter((m) => m._id.toString() !== userId)
    await chat.save()

    // 7) Build your clean JSON
    const members = (chat.members as PopulatedMember[]).map((m) => ({
        _id:           m._id.toString(),
        characterName: m.characterName,
        profileImage:  m.profileImage,
    }))

    return res.status(200).json({ members })
}

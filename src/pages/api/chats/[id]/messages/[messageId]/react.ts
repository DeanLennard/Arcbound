import type { NextApiRequest, NextApiResponse } from 'next'
import { Types } from 'mongoose'
import { dbConnect } from '@/lib/mongodb'
import Message, { IMessage, IReaction } from '@/models/Message'
import { requireAuth } from '@/lib/auth'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect()
    const session = await requireAuth(req, res)
    if (!session) return

    const { id: chatId, messageId } = req.query as {
        id: string
        messageId: string
    }

    if (req.method === 'POST') {
        const { emoji } = req.body as { emoji: string }

        // Tell TypeScript that this will be an IMessage document
        const msg = await Message.findOne<IMessage>({
            _id: messageId,
            chatId
        })

        if (!msg) {
            return res.status(404).json({ error: 'Message not found' })
        }

        // Our user‐id as an ObjectId
        const uid = new Types.ObjectId(session.user.id)

        // find an existing reaction subdoc
        const react = msg.reactions.find(r => r.emoji === emoji)

        if (!react) {
            // create & push a brand‐new IReaction
            const newReaction: IReaction = { emoji, users: [uid] }
            msg.reactions.push(newReaction)
        } else {
            // toggle the current user in that IReaction.users[]
            const idx = react.users.findIndex(u => u.equals(uid))
            if (idx >= 0) react.users.splice(idx, 1)
            else react.users.push(uid)
        }

        await msg.save()

        // return the entire typed reactions array
        return res.status(200).json({ reactions: msg.reactions })
    }

    res.setHeader('Allow', ['POST'])
    res.status(405).end()
}

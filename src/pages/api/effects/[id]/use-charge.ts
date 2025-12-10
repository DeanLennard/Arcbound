// pages/api/effects/[id]/use-charge.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect } from '@/lib/mongodb'
import Effect from '@/models/Effect'
import { getServerSession } from 'next-auth/next'
import authOptions from '@/lib/authOptions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST')
        return res.status(405).end(`Method ${req.method} Not Allowed`)

    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' })
    }

    await dbConnect()
    const { id } = req.query

    const fx = await Effect.findById(id)
    if (!fx) return res.status(404).json({ error: 'Effect not found' })

    if (typeof fx.charges !== 'number')
        return res.status(400).json({ error: 'Effect has no charges defined' })

    fx.charges = Math.max(0, fx.charges - 1)
    await fx.save()

    return res.status(200).json({ ok: true, charges: fx.charges })
}

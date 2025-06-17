// pages/api/game-phase/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession }                  from 'next-auth'
import authOptions                           from '@/lib/authOptions'
import { dbConnect }                         from '@/lib/mongodb'
import GamePhase, { GamePhaseDoc }           from '@/models/GamePhase'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GamePhaseDoc | { error: string }>
) {
    // 1) Only allow logged-in admins
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'admin') {
        // 401 if not logged in, 403 if not admin
        return !session
            ? res.status(401).json({ error: 'Not authenticated' })
            : res.status(403).json({ error: 'Admin access only' })
    }

    await dbConnect()

    switch (req.method) {
        case 'GET': {
            const gp = await GamePhase.findOne().lean<GamePhaseDoc>()
            if (!gp) return res.status(404).json({ error: 'No phase found' })
            return res.status(200).json(gp)
        }

        case 'PUT': {
            const { name, phase, isOpen } = req.body as {
                name:   string
                phase:  number
                isOpen: boolean
            }
            let gp = await GamePhase.findOne()
            if (gp) {
                gp.name   = name
                gp.phase  = phase
                gp.isOpen = isOpen
                await gp.save()
            } else {
                gp = await GamePhase.create({ name, phase, isOpen })
            }
            return res.status(200).json(gp)
        }

        default:
            res.setHeader('Allow', ['GET','PUT'])
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
}

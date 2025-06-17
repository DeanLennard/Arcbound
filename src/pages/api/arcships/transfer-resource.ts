// pages/api/arcships/transfer-resource.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Arcship from '@/models/Arcship'
import Diplomacy from '@/models/Diplomacy'

type ResourceKey =
    | 'alloysBalance'
    | 'energyBalance'
    | 'dataBalance'
    | 'essenceBalance'

interface TransferBody {
    fromShip: string
    toShip:   string
    resource: ResourceKey
    amount:   number | string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end()
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    // cast & destructure
    const { fromShip, toShip, resource, amount } =
        req.body as TransferBody

    await dbConnect()

    // coerce amount
    const amt = Number(amount)
    if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid amount' })
    }

    // validate resource key
    const validResources: ResourceKey[] = [
        'alloysBalance',
        'energyBalance',
        'dataBalance',
        'essenceBalance'
    ]
    if (!validResources.includes(resource)) {
        return res.status(400).json({ error: 'Invalid resource type' })
    }

    // load & authorize
    const me = await Arcship.findById(fromShip)
    if (!me) {
        return res.status(403).json({ error: 'Not allowed' })
    }
    const other = await Arcship.findById(toShip)
    if (!other) {
        return res.status(400).json({ error: 'Invalid target' })
    }

    // check Trade Agreement
    const pact = await Diplomacy.findOne({
        type: 'Trade Agreement',
        ships: { $all: [fromShip, toShip] }
    })
    if (!pact) {
        return res.status(400).json({ error: 'No trade agreement with that ship' })
    }

    // check balance
    const current = me.get(resource) as number
    if (current < amt) {
        return res
            .status(400)
            .json({ error: `Insufficient ${resource.replace('Balance','')}` })
    }

    // transfer
    me.set(resource, current - amt)
    const otherCurrent = other.get(resource) as number
    other.set(resource, otherCurrent + amt)

    await me.save()
    await other.save()

    return res.status(200).json({ success: true })
}

// pages/api/characters/transfer-item.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Character      from '@/models/Character'
import CharacterAsset from '@/models/CharacterAsset'
import Arcship        from '@/models/Arcship'
import { Types } from 'mongoose'
import GamePhase  from '@/models/GamePhase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end()
    }
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    const gp = await GamePhase.findOne();
    if (!gp.isOpen) return res.status(401).end()

    const { fromChar, targetChar, assetId } = req.body as {
        fromChar: string
        targetChar: string
        assetId: string
    }

    await dbConnect()

    // 1) Make sure the “from” character exists and belongs to you
    const meChar = await Character.findById(fromChar)
    if (!meChar || meChar.user.toString() !== session.user.id) {
        return res.status(403).json({ error: 'Not allowed' })
    }

    // 2) Fetch the asset & ensure it really belongs to that character
    const asset = await CharacterAsset.findById(assetId)
    if (!asset || asset.character.toString() !== fromChar) {
        return res.status(400).json({ error: 'Invalid asset' })
    }

    // 3) Figure out if this is a cross‐ship transfer
    const fromShipId = meChar.arcship?.toString()
    const toCharDoc = await Character
        .findById(targetChar)
        .select('arcship')
        .lean<{ arcship?: Types.ObjectId }>()
    const toShipId   = toCharDoc?.arcship?.toString()

    if (fromShipId && fromShipId !== toShipId) {
        // 4) Load the “from” arcship
        const fromShip = await Arcship.findById(fromShipId)
        if (!fromShip) return res.status(500).end()

        // 5) Compute baseShipping from senseTotal
        const senseTotal = (fromShip.sense.base ?? 0) + (fromShip.sense.mod ?? 0)
        const baseShipping = (() => {
            if (senseTotal <= 1) return 0
            if (senseTotal <= 4) return 1
            if (senseTotal <= 7) return 2
            if (senseTotal <= 9) return 3
            return 5
        })()

        // 6) Read modShipping and sum up
        const modShipping = fromShip.shippingItemsMod ?? 0
        const totalShipping = baseShipping + modShipping

        // 7) Validate capacity & fee
        if (
            totalShipping <= 0 ||
            fromShip.alloysBalance < 2000 ||
            fromShip.dataBalance  < 2000
        ) {
            return res
                .status(400)
                .json({ error: 'Ship lacks capacity or cannot pay the 2 000/alloys+data fee' })
        }

        // 8) Deduct the fee
        fromShip.alloysBalance -= 2000
        fromShip.dataBalance   -= 2000

        // 9) Consume one shipping slot
        fromShip.shippingItemsMod = modShipping - 1

        await fromShip.save()
    }

    // 10) Finally transfer asset
    asset.character = targetChar
    await asset.save()

    return res.status(200).json({ success: true })
}

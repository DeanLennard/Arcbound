// pages/api/characters/transfer-credit.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }                   from '@/lib/mongodb'
import {getServerSession} from "next-auth";
import authOptions from "@/lib/authOptions";
import Character                       from '@/models/Character'
import Arcship                         from '@/models/Arcship'
import EventLog   from '@/models/EventLog';
import GamePhase  from '@/models/GamePhase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    const gp = await GamePhase.findOne();
    if (!gp.isOpen) return res.status(401).end()

    await dbConnect()

    const { fromChar, targetType, targetId, amount } = req.body
    const amt = Number(amount)
    if (!amt || amt < 0) {
        return res.status(400).json({ error: 'Invalid amount' })
    }

    // 1) remove from your character
    const from = await Character.findByIdAndUpdate(
        fromChar,
        { $inc: { credits: -amt } },
        { new: true }
    )
    if (!from) {
        return res.status(404).json({ error: 'Source character not found' })
    }
    if (from.credits <= 0) {
        return res.status(400).json({ error: 'Insufficient funds' })
    }

    // 2) add to the target (character or ship)
    if (targetType === 'character') {
        const to = await Character.findByIdAndUpdate(
            targetId,
            { $inc: { credits: amt } },
            { new: true }
        )
        if (!to) return res.status(404).json({ error: 'Target character not found' })
    } else {
        const ship = await Arcship.findByIdAndUpdate(
            targetId,
            { $inc: { creditsBalance: amt } },
            { new: true }
        )
        if (!ship) return res.status(404).json({ error: 'Target ship not found' })

        // record to their event log
        await EventLog.create({
            eventName: 'Credit Transfer',
            effect:    `${amt} credits transferred from ${fromChar.name} to ${ship.name}`,
            phase:     gp?.name ?? 'Unknown',
            level:     'SPARK',
            ongoing:   false,
            arcship:   ship._id
        });
    }

    return res.status(200).json({ success: true, newBalance: from.credits })
}

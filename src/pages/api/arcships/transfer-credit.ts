// src/page/api/arcships/transfer-credits.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Arcship from '@/models/Arcship'
import Character from '@/models/Character'
import EventLog   from '@/models/EventLog';
import GamePhase  from '@/models/GamePhase';

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow','POST')
        return res.status(405).end()
    }
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    const gp = await GamePhase.findOne();
    if (!gp.isOpen) return res.status(401).end()

    const { fromShip, targetType, targetId, amount } = req.body
    const amt = Number(amount)
    await dbConnect()

    if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid amount' })
    }

    // load & authorize
    const me = await Arcship.findById(fromShip)
    if (!me) {
        return res.status(403).json({ error: 'Not allowed' })
    }
    if (me.creditsBalance < amt) {
        return res.status(400).json({ error: 'Insufficient credits' })
    }

    // debit
    me.creditsBalance -= amt
    await me.save()

    // credit target
    if (targetType === 'arcship') {
        const other = await Arcship.findById(targetId)
        if (!other) return res.status(400).json({ error: 'Invalid target' })
        other.creditsBalance += amt   // now both sides are numbers
        await other.save()

        // record to your event log
        await EventLog.create({
            eventName: 'Credit Transfer',
            effect:    `${amt} credits transferred from ${me.name} to ${other.name}`,
            phase:     gp?.name ?? 'Unknown',
            level:     'SPARK',
            ongoing:   false,
            arcship:   me._id
        });

        // record to their event log
        await EventLog.create({
            eventName: 'Credit Transfer',
            effect:    `${amt} credits transferred from ${me.name} to ${other.name}`,
            phase:     gp?.phase ?? 'Unknown',
            level:     'SPARK',
            ongoing:   false,
            arcship:   other._id
        });

    } else {
        const char = await Character.findById(targetId)
        if (!char) return res.status(400).json({ error: 'Invalid target' })
        char.credits += amt
        await char.save()

        // record to your event log
        await EventLog.create({
            eventName: 'Credit Transfer',
            effect:    `${amt} credits transferred from ${me.name} to ${char.charName}`,
            phase:     gp?.phase ?? 'Unknown',
            level:     'SPARK',
            ongoing:   false,
            arcship:   me._id
        });
    }

    return res.status(200).json({ success: true })
}

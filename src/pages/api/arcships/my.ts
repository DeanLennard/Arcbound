// pages/api/arcships/my.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import Character from '@/models/Character'
import Arcship from '@/models/Arcship'

export interface ShipSummary {
    _id: string
    name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    await dbConnect()

    // 1️⃣ load all *active* characters for this user,
    //    picking up both `arcship` and `AdditionalArcships`
    const myChars = await Character
        .find({ user: session.user.id, status: 'Active' })
        .select('arcship AdditionalArcships')
        .lean()

    // 2️⃣ collect all IDs (primary + extras)
    const allIds = new Set<string>()
    myChars.forEach(c => {
        if (c.arcship) allIds.add(c.arcship.toString())
        if (Array.isArray(c.AdditionalArcships)) {
            c.AdditionalArcships.forEach(x => allIds.add(x.toString()))
        }
    })

    // 3️⃣ fetch them in one go
    const ships = await Arcship
        .find({ _id: { $in: Array.from(allIds) } })
        .select('_id name xSector ySector flagUrl')
        .sort({ name: 1 })
        .lean<ShipSummary[]>()

    // Compute sense totals & range
    const shipsWithRange = ships.map(s => {
        const arcship = s as any; // since lean()
        const senseTotal = (arcship.sense?.base ?? 0) + (arcship.sense?.mod ?? 0);

        const baseRangeHexes =
            senseTotal <= 1 ? 0 :
                senseTotal <= 4 ? 1 :
                    senseTotal <= 7 ? 2 :
                        senseTotal <= 9 ? 3 : 5;

        const totalRangeHexes = baseRangeHexes + (arcship.targetRangeMod ?? 0);

        return {
            ...s,
            totalRangeHexes,
        };
    });

    return res.status(200).json(shipsWithRange);
}

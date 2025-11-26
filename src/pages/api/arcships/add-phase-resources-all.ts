import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { dbConnect } from '@/lib/mongodb';
import Arcship from '@/models/Arcship';
import EventLog from '@/models/EventLog';
import GamePhase from '@/models/GamePhase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end();
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admins only' });
    }

    await dbConnect();

    const gp = await GamePhase.findOne();
    const phase = gp?.phase ?? 'Unknown';

    // Load all arcships
    const ships = await Arcship.find({});

    let processed = 0;

    for (const ship of ships) {

        // — Compute income —
        const hullTotal  = ship.hull.base  + ship.hull.mod;
        const coreTotal  = ship.core.base  + ship.core.mod;
        const senseTotal = ship.sense.base + ship.sense.mod;
        const crewTotal  = ship.crew.base  + ship.crew.mod;

        const alloysIncome   = hullTotal  * 3000;
        const energyIncome   = coreTotal  * 3000;
        const dataIncome     = senseTotal * 3000;
        const essenceIncome  = crewTotal  * 1000;
        const creditsIncome  = crewTotal  * 1000;

        // Add to ship
        ship.alloysBalance   += alloysIncome;
        ship.energyBalance   += energyIncome;
        ship.dataBalance     += dataIncome;
        ship.essenceBalance  += essenceIncome;
        ship.creditsBalance  += creditsIncome;

        await ship.save();

        // Log for this ship individually
        await EventLog.create({
            arcship: ship._id,
            eventName: 'Phase Resource Gain',
            effect: `+${alloysIncome} Alloys, +${energyIncome} Energy, +${dataIncome} Data, +${essenceIncome} Essence, +${creditsIncome} Credits`,
            level: 'SPARK',
            ongoing: false,
            phase
        });

        processed++;
    }

    return res.status(200).json({ success: true, shipsProcessed: processed });
}

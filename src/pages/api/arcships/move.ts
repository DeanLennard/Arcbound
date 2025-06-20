// pages/api/arcships/move.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Arcship from '@/models/Arcship';
import Sector from '@/models/Sector';
import EventLog from "@/models/EventLog";
import GamePhase  from '@/models/GamePhase';
import {getServerSession} from "next-auth";
import authOptions from "@/lib/authOptions";

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow','POST');
        return res.status(405).end();
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    const gp = await GamePhase.findOne();
    if (!gp.isOpen) return res.status(401).end()

    await dbConnect();
    const { shipId, toSector } = req.body;

    // 1) Load ship + its current sector coords
    const ship = await Arcship.findById(shipId).populate<{ currentSector: { x:number, y:number } }>('currentSector');
    if (!ship) return res.status(404).json({ error: 'Ship not found' });

    const { x: fromX, y: fromY } = ship.currentSector!;

    // 2) Recompute movement
    const navTotal = ship.nav.base + ship.nav.mod;
    const baseInt = (() => {
        if (navTotal <= 0) return 0;
        if (navTotal <= 2) return 1;
        if (navTotal <= 4) return 2;
        if (navTotal <= 6) return 3;
        if (navTotal <= 8) return 4;
        return 5;
    })();
    const totalIntMovement = baseInt + (ship.movementInteractionMod||0);
    if (navTotal <= 0 || totalIntMovement <= 0) {
        return res.status(400).json({ error: 'No movement left' });
    }

    // 3) Fetch destination sector and validate adjacency
    const dest = await Sector.findById(toSector).lean();
    if (!dest) return res.status(404).json({ error: 'Destination not found' });
    if (Math.abs(dest.x - fromX) > 1 || Math.abs(dest.y - fromY) > 1) {
        return res.status(400).json({ error: 'Destination too far' });
    }

    // 4) Perform the move
    ship.currentSector    = dest._id;
    ship.xSector          = dest.x;
    ship.ySector          = dest.y;
    ship.movementInteractionMod = (ship.movementInteractionMod||0) - 1;
    await ship.save();

    await EventLog.create({
        eventName: 'Move Ship',
        effect:    `Arcship Moved to ${dest.name} ( ${dest.x}, ${dest.y} )`,
        phase:     gp?.name ?? 'Unknown',
        level:     'SURGE',
        ongoing:   false,
        arcship:   ship._id
    });

    return res.status(200).json({
        success:       true,
        currentSector: dest._id,
        xSector:       dest.x,
        ySector:       dest.y,
        movementRemaining: totalIntMovement - 1,
    });
}

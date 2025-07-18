// /pages/api/characters/factions.ts
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { dbConnect } from '@/lib/mongodb';
import Character from '@/models/Character';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    await dbConnect();
    const characters = await Character.find({
        user: session.user.id,
        status: 'Active'
    }).select('faction').lean();

    const factions = [...new Set(characters.map(c => c.faction))]; // dedupe
    return res.status(200).json({ factions });
}

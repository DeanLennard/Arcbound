//src/pages/api/character-assets/[id]/use-charge.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/authOptions'
import { dbConnect } from '@/lib/mongodb'
import CharacterAsset from '@/models/CharacterAsset'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end();
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
    }

    await dbConnect();

    const { id } = req.query;

    const asset = await CharacterAsset.findById(id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const max = asset.charges ?? 0;

    // Initialise if unset
    if (asset.currentCharges == null) {
        asset.currentCharges = max;
    }

    if (asset.currentCharges <= 0) {
        return res.status(400).json({ error: 'No charges left' });
    }

    asset.currentCharges -= 1;
    await asset.save();

    return res.status(200).json({ success: true, currentCharges: asset.currentCharges });
}

// pages/api/characters/[[id]].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Character from '@/models/Character';
import '@/models/Arcship'
import '@/models/CharacterAsset'
import '@/models/Phase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    await dbConnect();

    // GET the character (with all the right populated paths)
    const char = await Character.findById(id)
        .populate([
            'arcship',
            'phases'
        ])
        .lean();

    if (!char) {
        return res.status(404).json({ error: 'Not found' });
    }

    switch (req.method) {
        case 'GET':
            return res.status(200).json(char);
        case 'PUT':
            const updated = await Character.findByIdAndUpdate(id, req.body, { new: true })
                .lean();
            return res.status(200).json(updated);
        case 'DELETE':
            await Character.findByIdAndDelete(id);
            return res.status(204).end();
        default:
            res.setHeader('Allow', ['GET','PUT','DELETE']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

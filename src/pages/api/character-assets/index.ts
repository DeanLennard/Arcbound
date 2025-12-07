// pages/api/character-assets/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }               from '@/lib/mongodb'
import CharacterAsset, {
    type CharacterAssetDoc  // ← make sure your model exports its document type
} from '@/models/CharacterAsset'
import type { FilterQuery } from 'mongoose'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect()
    const { character, category } = req.query

    if (req.method === 'GET') {
        // use Mongoose's FilterQuery<Document> rather than `any`
        const filter: FilterQuery<CharacterAssetDoc> = {}
        if (character) filter.character = character as string
        if (category)  filter.category  = category  as string

        const assets = await CharacterAsset.find(filter).lean()
        return res.status(200).json(assets)
    }

    if (req.method === 'POST') {
        const body = req.body;

        // Initialise currentCharges if the asset uses charges
        if (typeof body.charges === 'number' && body.charges > 0) {
            body.currentCharges = body.currentCharges ?? body.charges;
        }

        const created = await CharacterAsset.create(body);
        return res.status(201).json(created);
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

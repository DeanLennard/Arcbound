// pages/api/character-assets/[[id]].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }               from '@/lib/mongodb'
import CharacterAsset              from '@/models/CharacterAsset'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    await dbConnect()

    if (req.method === 'PUT') {
        const updated = await CharacterAsset.findByIdAndUpdate(id, req.body, { new: true }).lean()
        return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
        await CharacterAsset.findByIdAndDelete(id)
        return res.status(204).end()
    }
    res.setHeader('Allow', ['PUT','DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

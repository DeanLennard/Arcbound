// pages/api/character-assets/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { dbConnect }               from '@/lib/mongodb'
import CharacterAsset              from '@/models/CharacterAsset'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect()
    const { character, category } = req.query

    if (req.method === 'GET') {
        const filter: any = {}
        if (character) filter.character = character
        if (category)  filter.category  = category
        const assets = await CharacterAsset.find(filter).lean()
        return res.status(200).json(assets)
    }

    if (req.method === 'POST') {
        const created = await CharacterAsset.create(req.body)
        return res.status(201).json(created)
    }

    res.setHeader('Allow', ['GET','POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

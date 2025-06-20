// src/pages/api/character-assets/build.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession }            from 'next-auth'
import authOptions                     from '@/lib/authOptions'
import { dbConnect }                   from '@/lib/mongodb'
import CharacterAsset, { AssetCategory } from '@/models/CharacterAsset'
import Character                       from '@/models/Character'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).end()

    const { scrapId, characterId } = req.body as { scrapId: string; characterId: string }
    await dbConnect()

    // 1) Load scrapcode
    const scrap = await CharacterAsset.findById(scrapId)
    if (!scrap || scrap.category !== 'Scrapcode')
        return res.status(404).json({ error: 'Scrapcode not found' })

    // 2) Load character
    const character = await Character.findById(characterId)
    if (!character)
        return res.status(404).json({ error: 'Character not found' })

    // 3) Check credits
    const cost = scrap.buildCredits || 0
    if (character.credits < cost) {
        const formatted = cost.toLocaleString()      // e.g. "1,234"
        return res
            .status(400)
            .json({ error: `Not enough credits (${formatted} required)` })
    }

    // 4) Deduct credits and save
    character.credits -= cost
    await character.save()

    // 5) Determine new asset category
    let newCategory: AssetCategory
    if (scrap.buildType === 'ITEM') {
        newCategory = 'Item'
    } else if (scrap.buildType === 'IMPLANT') {
        newCategory = 'Implant'
    } else {
        return res.status(400).json({ error: `Unsupported buildType: ${scrap.buildType}` })
    }

    // 6) Clone the scrapcode into a new active asset
    const built = new CharacterAsset({
        name:        scrap.name,
        description: scrap.description,
        level:       scrap.level,
        state:       'Active',
        category:    newCategory,
        character:   characterId,
        // you could copy other fields if needed...
    })
    await built.save()

    return res.status(201).json({ success: true })
}

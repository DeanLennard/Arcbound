// pages/api/modules/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import           { dbConnect }             from '@/lib/mongodb'
import Module, { type ModuleDoc }             from '@/models/Module'
import type { FilterQuery }                   from 'mongoose'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    await dbConnect()

    if (req.method === 'GET') {
        // list only those attached to a particular ship:
        const { attachedTo } = req.query

        // use a FilterQuery<ModuleDoc> instead of `any`
        const filter: FilterQuery<ModuleDoc> = {}
        if (typeof attachedTo === 'string') {
            filter.attachedTo = attachedTo === 'null' ? null : attachedTo
        }

        const mods = await Module.find(filter).lean()
        return res.status(200).json(mods)
    }

    if (req.method === 'POST') {
        // expects { name, description, state, cost, prereqs, attachedTo }
        const created = await Module.create(req.body)
        return res.status(201).json(created)
    }

    res.setHeader('Allow', ['GET','POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

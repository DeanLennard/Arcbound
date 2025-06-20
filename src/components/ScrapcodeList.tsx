// components/ScrapcodeList.tsx
'use client'
import { useState } from 'react'

interface Props {
    scrapcode: Scrapcode[]
    characterId: string
}

export interface Scrapcode {
    _id: string
    name: string
    description: string
    level: string
    state: string
    buildType: 'ITEM' | 'IMPLANT'
    buildCredits: number
    buildAlloys: number
    buildEnergy: number
    buildData: number
    buildEssence: number
}

export default function ScrapcodeList({ scrapcode, characterId }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)

    async function handleBuild(scrapId: string) {
        setError(null)
        setBusyId(scrapId)
        try {
            const res = await fetch('/api/character-assets/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scrapId, characterId }),
            })
            if (!res.ok) {
                const { error: serverError } = await res.json()
                throw new Error(serverError || 'Build failed')
            }
            window.location.reload()
        } catch (e: unknown) {
            // narrow `unknown` into an Error or fallback to string
            const message =
                e instanceof Error ? e.message : String(e)
            setError(message)
        } finally {
            setBusyId(null)
        }
    }

    return (
        <section>
            <h2 className="text-2xl font-semibold mb-2 text-yellow-300">Scrapcode Compendium</h2>
            {error && <p className="text-red-400 mb-2">{error}</p>}
            <ul className="space-y-2">
                {scrapcode.map(rel => (
                    <li key={String(rel._id)} className="bg-gray-800 p-4 rounded-lg">
                        <strong className="block text-indigo-300 text-lg mb-2">{rel.name}</strong>
                        <span className="inline-block ml-0 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                            {rel.level}
                        </span>{' '}
                        <span
                            className={`inline-block ml-2 text-xs px-1 py-0.5 rounded ${
                                rel.state === 'Active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}
                        >
                            {rel.state}
                        </span>
                        <div className="text-gray-200 mt-1">
                            <div className="inline">
                                <strong>{rel.buildType}</strong>&nbsp;
                            </div>
                            {rel.description}
                        </div>
                        <div className="mt-2 space-x-4 text-gray-200">
                            {rel.buildCredits > 0 && <span>Credits: {rel.buildCredits.toLocaleString()}</span>}
                            {rel.buildAlloys  > 0 && <span>Alloys:  {rel.buildAlloys.toLocaleString()}</span>}
                            {rel.buildEnergy  > 0 && <span>Energy:  {rel.buildEnergy.toLocaleString()}</span>}
                            {rel.buildData    > 0 && <span>Data:    {rel.buildData.toLocaleString()}</span>}
                            {rel.buildEssence > 0 && <span>Essence: {rel.buildEssence.toLocaleString()}</span>}
                        </div>
                        <button
                            disabled={busyId === rel._id}
                            onClick={() => handleBuild(String(rel._id))}
                            className={`mt-2 px-3 py-1 rounded ${
                                busyId === rel._id
                                    ? 'bg-gray-500 cursor-wait'
                                    : 'bg-yellow-500 hover:bg-yellow-600'
                            } text-black`}
                        >
                            {busyId === rel._id ? 'Building…' : 'Build'}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}

// src/app/diplomacy/page.tsx
'use client'

import { ChangeEvent, useEffect, useState, useMemo } from 'react'
import useSWR from 'swr'

type FactionName =
    | 'The Virean Ascendancy'
    | 'The Aeon Collective'
    | 'The Sundered Concord'
    | 'The Helion Federation'
    | 'The Korveth Dominion'
    | 'The Tyr Solaris Imperium'
    | 'The Hollow Pact'
    | 'The Threadkeepers of Luvenn'
    | 'The Second Spiral'
    | 'House Ziralex'
    | 'The Ninefold Choir'
    | 'The Unmade'

type Stance = 'Allied' | 'Friendly' | 'Neutral' | 'Strained' | 'Hostile' | 'WAR'

interface Relation {
    source:   FactionName
    target:   FactionName
    stance:   Stance
    progress: number
}

interface DiplomacyAPI {
    phase:     number
    allPhases: number[]
    records:   Relation[]
}

const STANCE_COLORS: Record<Stance,string> = {
    Allied:   '#2d6a4f',
    Friendly: '#52b788',
    Neutral:  '#f0b429',
    Strained: '#f77f00',
    Hostile:  '#d00000',
    WAR:      '#000000'
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DiplomacyDashboard() {
    const [phase, setPhase] = useState<number | null>(null)
    const [selectedFaction, setSelectedFaction] = useState<FactionName | 'All'>('All')

    const { data, error } = useSWR<DiplomacyAPI>(
        phase != null
            ? `/api/diplomatic-state?phase=${phase}`
            : '/api/diplomatic-state',
        fetcher
    )

    // initialize phase once
    useEffect(() => {
        if (data && phase === null) setPhase(data.phase)
    }, [data, phase])

    // build the dropdown options: all unique factions in source or target
    const factions = useMemo(() => {
        if (!data) return []
        const set = new Set<FactionName>()
        data.records.forEach(r => {
            set.add(r.source)
            set.add(r.target)
        })
        return ['All', ...Array.from(set).sort()] as (FactionName | 'All')[]
    }, [data])

    // filtered list
    const filtered = useMemo(() => {
        if (!data) return []
        if (selectedFaction === 'All') return data.records
        return data.records.filter(r =>
            r.source === selectedFaction || r.target === selectedFaction
        )
    }, [data, selectedFaction])

    if (error) return <p className="p-6 text-red-400">Error loading diplomacy.</p>
    if (!data || phase === null) return <p className="p-6 text-gray-300">Loading…</p>

    return (
        <main className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4">
            <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
                <h1 className="text-2xl font-bold text-white">Diplomacy by Phase</h1>

                <div className="flex flex-wrap items-center space-x-6">
                    {/* Phase selector */}
                    <div className="flex items-center space-x-2">
                        <label className="text-white font-medium">Phase:</label>
                        <select
                            value={phase}
                            onChange={e => setPhase(+e.target.value)}
                            className="px-2 py-1 bg-gray-700 text-white rounded"
                        >
                            {data.allPhases.map(n => (
                                <option key={n} value={n}>Phase {n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Faction filter */}
                    <div className="flex items-center space-x-2">
                        <label className="text-white font-medium">Faction:</label>
                        <select
                            value={selectedFaction}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                setSelectedFaction(e.target.value as FactionName | 'All')
                            }
                            className="px-2 py-1 bg-gray-700 text-white rounded"
                        >
                            {factions.map(f => (
                                <option key={f} value={f}>
                                    {f === 'All' ? 'All Factions' : f}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Relations list */}
                <ul className="divide-y divide-gray-600">
                    {filtered.map((rec, i) => (
                        <li
                            key={`${rec.source}-${rec.target}`}
                            className={`py-3 flex flex-wrap items-center 
                            ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}
                        >
                            <div className="w-1/5 text-white font-medium flex items-center">
                                {rec.source}
                                {selectedFaction !== 'All' && selectedFaction === rec.source && (
                                    <span className="ml-2 text-sm">(→)</span>
                                )}
                            </div>
                            <div className="w-1/5 text-gray-200 flex items-center">
                                {rec.target}
                                {selectedFaction !== 'All' && selectedFaction === rec.target && (
                                    <span className="ml-2 text-sm">(←)</span>
                                )}
                            </div>
                            <div className="w-1/5 text-gray-200 italic">{rec.stance}</div>
                            <div className="w-2/5 flex items-center">
                                <div className="relative flex-1 h-2 bg-gray-600 rounded overflow-hidden">
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            width: `${rec.progress}%`,
                                            backgroundColor: STANCE_COLORS[rec.stance]
                                        }}
                                    />
                                </div>
                                <span className="ml-2 text-gray-200 text-sm">
                                  {rec.progress}%
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    )
}

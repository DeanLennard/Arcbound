// src/app/(dashboard)/admin/diplomacy/page.tsx
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

type Stance      = 'Allied' | 'Friendly' | 'Neutral' | 'Strained' | 'Hostile' | 'WAR'

interface Relation {
    source:   FactionName
    target:   FactionName
    stance:   Stance
    progress: number
}

interface API {
    phase:     number
    allPhases: number[]
    records:   Relation[]
}

const STANCE_OPTIONS: Stance[] = ['Allied','Friendly','Neutral','Strained','Hostile','WAR']
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminDiplomacyPage() {
    const [phase, setPhase] = useState<number>(1)
    const { data, error, mutate } = useSWR<API>(
        phase === null
            ? '/api/diplomatic-state'
            : `/api/diplomatic-state?phase=${phase}`,
        fetcher
    )

    const [edits, setEdits] = useState<Relation[]>([])
    const [filterFaction, setFilterFaction] = useState<FactionName | 'All'>('All')

    useEffect(() => {
        if (data) {
            setPhase(data.phase)
            setEdits(data.records.map(r => ({ ...r })))
        }
    }, [data])

    // NEW: compute the list of all factions seen in this phase
    const allFactions = useMemo(() => {
        const set = new Set<FactionName>()
        ;(data?.records ?? []).forEach(r => {
            set.add(r.source)
            set.add(r.target)
        })
        return ['All', ...Array.from(set).sort()] as (FactionName | 'All')[]
    }, [data])

    // NEW: filter the edits list by the selected faction
    interface WithIdx { rec: Relation; idx: number }

    const displayed = useMemo<WithIdx[]>(() => {
        return edits
            .map((rec, idx) => ({ rec, idx }))
            .filter(({ rec }) =>
                filterFaction === 'All'
                    ? true
                    : rec.source === filterFaction || rec.target === filterFaction
            )
    }, [edits, filterFaction])

    if (error) return <p className="p-6 text-red-600">Failed to load.</p>
    if (!data)  return <p className="p-6">Loading…</p>

    const onChangeStance = (i: number, stance: Stance) => {
        setEdits(e => {
            const nxt = [...e]; nxt[i].stance = stance; return nxt
        })
    }
    const onChangeProg = (i: number, prog: number) => {
        setEdits(e => {
            const nxt = [...e]; nxt[i].progress = prog; return nxt
        })
    }

    const saveAll = async () => {
        await fetch('/api/diplomatic-state', {
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ phase, updates: edits })
        })
        mutate()
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Manage Diplomacy</h1>

            <div className="flex items-center space-x-4">
                <label className="font-medium">Phase:</label>
                <select
                    value={phase}
                    onChange={e => setPhase(+e.target.value)}
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                >
                    {data.allPhases.map(n => (
                        <option key={n} value={n}>Phase {n}</option>
                    ))}
                </select>
                <button
                    className="btn-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded hidden md:inline"
                    onClick={async () => {
                        await fetch('/api/diplomatic-state/populate', {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ phase })
                        })
                        mutate()
                    }}
                >Populate Phase</button>
            </div>

            <div className="flex items-center space-x-2">
                <label className="font-medium">Faction:</label>
                <select
                    value={filterFaction}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        // e.target.value is a string; cast it to your union.
                        setFilterFaction(e.target.value as FactionName | 'All')
                    }}
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                >
                    {allFactions.map(f => (
                        <option key={f} value={f}>
                            {f === 'All' ? 'All Factions' : f}
                        </option>
                    ))}
                </select>
            </div>

            <ul className="divide-y divide-gray-600">
                {displayed.map(({ rec, idx }) => (
                    <li
                        key={`${rec.source}-${rec.target}`}
                        className="py-2 flex flex-wrap items-center odd:bg-gray-800 even:bg-gray-700"
                    >
                        <div className="w-1/4 text-white font-medium">{rec.source}</div>
                        <div className="w-1/4 text-white">{rec.target}</div>
                        <div className="w-1/4">
                            <select
                                value={rec.stance}
                                onChange={e => onChangeStance(idx, e.target.value as Stance)}
                                className="px-2 py-1 bg-gray-600 text-white rounded"
                            >
                                {STANCE_OPTIONS.map(s =>
                                    <option key={s} value={s}>{s}</option>
                                )}
                            </select>
                        </div>
                        <div className="w-1/4 flex items-center">
                            <input
                                type="range"
                                min={0} max={100}
                                value={rec.progress}
                                onChange={e => onChangeProg(idx, +e.target.value)}
                                className="flex-1"
                            />
                            <span className="ml-2 text-white">{rec.progress}%</span>
                        </div>
                    </li>
                ))}
            </ul>

            <button
                className="btn bg-green-600 hover:bg-green-700 px-3 py-1 rounded hidden md:inline"
                onClick={saveAll}
            >Save All</button>
        </div>
    )
}
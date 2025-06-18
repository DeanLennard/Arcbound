// src/components/PhaseHistory.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

export interface Phase {
    _id:      string
    number:   number
    interaction: string
    gambit:      string
    resolution:  string
}

export default function PhaseHistory({ phases }: { phases: Phase[] }) {
    // track which panels are open
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
    // expandAll toggle
    const allOpen = useMemo(
        () => phases.every(ph => openMap[ph._id]),
        [phases, openMap]
    )

    // search query
    const [query, setQuery] = useState('')
    const q = query.trim().toLowerCase()

    // filtered list
    const filtered = useMemo(() => {
        if (!q) return phases
        return phases.filter(ph => {
            return (
                ph.interaction.toLowerCase().includes(q) ||
                ph.gambit.toLowerCase().includes(q) ||
                ph.resolution.toLowerCase().includes(q)
            )
        })
    }, [phases, q])

    // toggle a single panel
    const toggle = (id: string) =>
        setOpenMap(m => ({ ...m, [id]: !m[id] }))

    // expand or collapse all
    const toggleAll = () => {
        const next = {} as Record<string, boolean>
        filtered.forEach(ph => {
            next[ph._id] = !allOpen
        })
        setOpenMap(m => ({ ...m, ...next }))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <input
                    type="text"
                    placeholder="Search phases…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded flex-1 mr-2"
                />
                <button
                    onClick={toggleAll}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                    {allOpen ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            {filtered.length === 0 ? (
                <p className="text-gray-400 italic">No matching phases.</p>
            ) : (
                filtered.map(ph => {
                    const isOpen = !!openMap[ph._id]
                    return (
                        <div
                            key={ph._id}
                            className="bg-gray-800 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => toggle(ph._id)}
                                className="w-full flex justify-between items-center px-4 py-2 text-left"
                            >
                <span className="text-indigo-300 font-semibold">
                  Phase {ph.number}
                </span>
                                {isOpen ? (
                                    <ChevronUpIcon className="w-5 h-5 text-gray-300" />
                                ) : (
                                    <ChevronDownIcon className="w-5 h-5 text-gray-300" />
                                )}
                            </button>

                            {isOpen && (
                                <div className="px-6 py-4 space-y-4 border-t border-gray-700">
                                    <div>
                                        <p className="font-semibold text-gray-200 mb-1">
                                            Interaction
                                        </p>
                                        <div
                                            className="prose prose-sm prose-white max-w-none break-words"
                                            dangerouslySetInnerHTML={{ __html: ph.interaction }}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-200 mb-1">Gambit</p>
                                        <div
                                            className="prose prose-sm prose-white max-w-none break-words"
                                            dangerouslySetInnerHTML={{ __html: ph.gambit }}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-200 mb-1">
                                            Resolution
                                        </p>
                                        <div
                                            className="prose prose-sm prose-white max-w-none break-words"
                                            dangerouslySetInnerHTML={{ __html: ph.resolution }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}

// src/app/(dashboard)/admin/characters/page.tsx
'use client'

import { useState } from 'react'
import useSWR       from 'swr'
import Link from "next/link";
import CharacterForm, { CharacterFormData } from './CharacterForm'
import type { CharacterSummary } from './types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminCharacters() {
    const { data, error, mutate } = useSWR<CharacterSummary[]>('/api/characters', fetcher)
    const [editing, setEditing] = useState<Partial<CharacterFormData> | null>(null)

    if (error) return <p className="p-6">Failed to load</p>
    if (!data) return <p className="p-6">Loading…</p>

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Manage Characters</h1>
            <button onClick={() => setEditing({})} className="btn">+ New Character</button>

            {editing && (
                <CharacterForm
                    initial={editing}
                    onSuccess={() => { setEditing(null); mutate() }}
                    onCancel={() => setEditing(null)}
                />
            )}

            <ul className="divide-y">
                {data.map((char) => (
                    <li key={char._id} className="py-2 flex justify-between">
                        <span>
                          {char.charName} (
                            {char.user?.playerName || '— no player —'}
                            )
                        </span>
                        <div className="space-x-2">
                            <Link
                                href={`/characters/${char._id}`}
                                className="btn-sm"
                            >
                                View
                            </Link>
                            <Link
                                href={`/admin/characters/${char._id}`}
                                className="btn-sm"
                            >
                                Manage
                            </Link>
                            <button
                                onClick={() => {
                                    setEditing({
                                        _id:      char._id,
                                        charName: char.charName,
                                        status:   char.status,
                                        faction:  char.faction,
                                        role:     char.role,
                                        race:     char.race,
                                        archetype: char.archetype,
                                        user:    char.user?._id ?? '',
                                        arcship: char.arcship?._id ?? '',
                                    })
                                }}
                                className="btn-sm"
                            >
                                Edit
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

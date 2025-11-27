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
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Retired' | 'Dead' >('Active');
    const [search, setSearch] = useState('');
    const [npcFilter, setNpcFilter] = useState<'All' | 'NPC' | 'NotNPC'>('NotNPC');

    if (error) return <p className="p-6">Failed to load</p>
    if (!data) return <p className="p-6">Loading…</p>

    const sortedChars = [...data].sort((a, b) =>
        a.charName.localeCompare(b.charName, undefined, { sensitivity: 'base' })
    );

    const filteredChars = sortedChars.filter((char) => {
        // Status filter
        if (statusFilter !== 'All' && char.status !== statusFilter) return false;

        if (npcFilter === 'NPC' && char.npc !== true) return false
        if (npcFilter === 'NotNPC' && char.npc === true) return false

        // Free-text search
        if (search.trim() !== '') {
            const q = search.toLowerCase();

            const fields = [
                char.charName,
                char.faction,
                char.archetype,
                char.race,
                char.role,
                char.user?.playerName ?? ''
            ];

            const matches = fields.some((field) =>
                field?.toLowerCase().includes(q)
            );

            if (!matches) return false;
        }

        return true;
    });


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

            <div className="flex items-center space-x-4">
                <label className="text-gray-300">Filter by Status:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Retired' | 'Dead')}
                    className="bg-gray-700 text-white p-1 rounded"
                >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Dead">Dead</option>
                </select>

                <label className="text-gray-300 ml-4">NPC:</label>
                <select
                    value={npcFilter}
                    onChange={(e) => setNpcFilter(e.target.value as 'All' | 'NPC' | 'NotNPC')}
                    className="bg-gray-700 text-white p-1 rounded"
                >
                    <option value="All">All</option>
                    <option value="NPC">NPC Only</option>
                    <option value="NotNPC">Not NPC</option>
                </select>

                <input
                    type="text"
                    placeholder="Search characters…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-700 text-white p-1 rounded w-64"
                />
            </div>

            <div className="text-gray-300 text-sm">
                Showing {filteredChars.length} of {sortedChars.length} characters
            </div>

            <ul className="divide-y divide-gray-600">
                {filteredChars.map((char) => (
                    <li key={char._id} className="py-2 flex justify-between odd:bg-gray-800 even:bg-gray-700">
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
                                        npc:     char.npc,
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

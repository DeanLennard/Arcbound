// src/app/(dashboard)/admin/arcships/page.tsx
'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import ArcshipForm, { ArcshipFormData } from './ArcshipForm';
import Link from 'next/link';
import type { SectorDoc } from '@/models/Sector'

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminArcships() {
    const { data, error, mutate } = useSWR<ArcshipFormData[]>('/api/arcships', fetcher);
    const { data: sectors } = useSWR<SectorDoc[]>('/api/sectors', fetcher)
    const [editing, setEditing] = useState<ArcshipFormData | null>(null);
    const [cloakFilter, setCloakFilter] =
        useState<'All' | 'Cloaked' | 'NotCloaked'>('All');
    const [search, setSearch] = useState('');

    // build a lookup map from sector‐ID to {name,x,y}
    const sectorLookup = useMemo<
        Record<string, { name: string; x: number; y: number }>
    >(() => {
        return (sectors ?? []).reduce((acc, s) => {
            acc[s._id] = { name: s.name, x: s.x, y: s.y };
            return acc;
        }, {} as Record<string, { name: string; x: number; y: number }>);
    }, [sectors]);

    if (error) return <p className="p-6">Failed to load</p>;
    if (!data)  return <p className="p-6">Loading…</p>;

    const sortedShips = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Manage Arcships</h1>
            <button onClick={() => setEditing({} as ArcshipFormData)} className="btn">
                + New Arcship
            </button>

            {editing && (
                <ArcshipForm
                    initial={editing}
                    onSuccess={() => { setEditing(null); mutate() }}
                    onCancel={() => setEditing(null)}
                />
            )}

            <div className="flex items-center space-x-4 mt-4">
                {/* Cloak Filter */}
                <div>
                    <label className="text-gray-300 mr-2">Cloak Status:</label>
                    <select
                        value={cloakFilter}
                        onChange={(e) => setCloakFilter(e.target.value as any)}
                        className="bg-gray-700 text-white p-1 rounded"
                    >
                        <option value="All">All</option>
                        <option value="Cloaked">Cloaked</option>
                        <option value="NotCloaked">Not Cloaked</option>
                    </select>
                </div>

                {/* Free-text search */}
                <input
                    type="text"
                    placeholder="Search arcships…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-700 text-white p-1 rounded w-64"
                />
            </div>

            <ul className="divide-y divide-gray-600">
                {sortedShips
                    .filter(ship => {
                        // CLOAK FILTER
                        if (cloakFilter === 'Cloaked' && !ship.isCloaked) return false;
                        if (cloakFilter === 'NotCloaked' && ship.isCloaked) return false;

                        // SEARCH FILTER
                        if (search.trim() !== '') {
                            const q = search.toLowerCase();

                            const fields = [
                                ship.name,
                                ship.faction,
                                ship.benefit,
                                ship.challenge,
                            ];

                            if (!fields.some(f => f?.toLowerCase().includes(q))) {
                                return false;
                            }
                        }

                        return true;
                    })
                    .map(ship => (
                        <li
                        key={ship._id}
                        className="py-2 flex items-center justify-between odd:bg-gray-800 even:bg-gray-700"
                    >
                        <span>{ship.name}</span>
                        <span>{ship.faction}</span>
                        <span>{sectorLookup[ship.currentSector]?.name ?? ship.currentSector} ({sectorLookup[ship.currentSector]?.x}, {sectorLookup[ship.currentSector]?.y})</span>
                        <div className="space-x-2">
                            <Link
                                href={`/arcships/${ship._id}`}
                                className="btn-sm"
                            >
                                View
                            </Link>
                            <Link
                                href={`/admin/arcships/${ship._id}`}
                                className="btn-sm"
                            >
                                Manage
                            </Link>
                            <button
                                onClick={() => setEditing(ship)}
                                className="btn-sm"
                            >
                                Edit
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

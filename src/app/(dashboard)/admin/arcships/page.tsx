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

            <ul className="divide-y divide-gray-600">
                {sortedShips.map(ship => (
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

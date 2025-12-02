// src/app/(dashboard)/admin/sectors/page.tsx
'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { SectorDoc } from '@/models/Sector';
import AddSectorModal from './AddSectorModal';
import EditSectorModal from './EditSectorModal';
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminSectorsPage() {
    const { data: sectors, error } = useSWR<SectorDoc[]>('/api/sectors', fetcher);
    const [showAdd, setShowAdd] = useState(false);
    const [editSector, setEditSector] = useState<SectorDoc | null>(null);

    if (error) return <p className="p-4 text-red-500">Failed to load sectors</p>;
    if (!sectors) return <p className="p-4">Loading…</p>;

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Manage Sectors</h1>
            <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
                + Add Sector
            </button>

            <table className="min-w-full bg-white text-gray-900 rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                <tr>
                    {['Name','X','Y','Control','Actions'].map(h => (
                        <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {sectors.map(s => (
                    <tr key={s._id} className="border-t">
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2">{s.x}</td>
                        <td className="px-4 py-2">{s.y}</td>
                        <td className="px-4 py-2">{s.control}</td>
                        <td className="px-4 py-2 space-x-2">
                            <Link
                                href={`/sectors/${s._id}`}
                                className="btn-sm"
                            >
                                View
                            </Link>
                            <button
                                onClick={() => setEditSector(s)}
                                className="px-2 py-1 bg-blue-600 text-white rounded"
                            >Edit</button>
                            <button
                                onClick={async () => {
                                    if (!confirm(`Delete sector ${s.name}?`)) return;
                                    await fetch(`/api/sectors/${s._id}`, { method: 'DELETE' });
                                    await mutate('/api/sectors');
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded"
                            >Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {showAdd && (
                <AddSectorModal
                    onClose={() => setShowAdd(false)}
                />
            )}
            {editSector && (
                <EditSectorModal
                    sector={editSector}
                    onClose={() => setEditSector(null)}
                />
            )}
        </div>
    );
}

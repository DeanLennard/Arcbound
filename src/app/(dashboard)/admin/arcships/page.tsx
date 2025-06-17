// src/app/(dashboard)/admin/arcships/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import ArcshipForm, { ArcshipFormData } from './ArcshipForm';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminArcships() {
    const { data, error, mutate } = useSWR<ArcshipFormData[]>('/api/arcships', fetcher);
    const [editing, setEditing] = useState<ArcshipFormData | null>(null);

    if (error) return <p className="p-6">Failed to load</p>;
    if (!data)  return <p className="p-6">Loading…</p>;

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

            <ul className="divide-y">
                {data.map(ship => (
                    <li
                        key={ship._id}
                        className="py-2 flex items-center justify-between"
                    >
                        <span>{ship.name}</span>
                        <div className="space-x-2">
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

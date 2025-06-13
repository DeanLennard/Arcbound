// src/app/(dashboard)/admin/arcships/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import ArcshipForm from './ArcshipForm';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminArcships() {
    const { data, error, mutate } = useSWR('/api/arcships', fetcher);
    const [editing, setEditing] = useState<any>(null);

    if (error) return <p className="p-6">Failed to load</p>;
    if (!data) return <p className="p-6">Loading…</p>;

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Manage Arcships</h1>
            <button onClick={() => setEditing({})} className="btn">+ New Arcship</button>
            {editing && (
                <ArcshipForm
                    initial={editing}
                    onSuccess={() => { setEditing(null); mutate(); }}
                    onCancel={() => setEditing(null)}
                />
            )}
            <ul className="divide-y">
                {data.map((ship: any) => (
                    <li key={ship._id} className="py-2 flex justify-between">
                        <span>{ship.name}</span>
                        <button onClick={() => setEditing(ship)} className="btn-sm">Edit</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

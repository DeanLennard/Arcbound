// src/app/(dashboard)/admin/sectors/ManageSectorEffectsModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';

interface EffectOption {
    _id: string;
    name: string;
    kind: string;
    level: number;
}

export default function ManageSectorEffectsModal({
                                                     sector,
                                                     onClose
                                                 }: {
    sector: any;
    onClose: () => void;
}) {
    const [effects, setEffects] = useState<EffectOption[]>([]);
    const [selected, setSelected] = useState<string[]>(sector.effects?.map((e: any) => e._id) || []);

    useEffect(() => {
        fetch('/api/effects')
            .then(res => res.json())
            .then(setEffects);
    }, []);

    const toggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const save = async () => {
        await fetch(`/api/sectors/${sector._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ effects: selected })
        });

        await mutate('/api/sectors');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded w-full max-w-md space-y-4">
                <h2 className="text-xl text-white">Manage Effects – {sector.name}</h2>

                <div className="max-h-64 overflow-y-auto space-y-2">
                    {effects.map(e => (
                        <label key={e._id} className="flex items-center space-x-2 text-white">
                            <input
                                type="checkbox"
                                checked={selected.includes(e._id)}
                                onChange={() => toggle(e._id)}
                            />
                            <span>{e.name} (Lv {e.level}) — {e.kind}</span>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-3 py-1 bg-gray-600 rounded text-white">Cancel</button>
                    <button onClick={save} className="px-3 py-1 bg-indigo-600 rounded text-white">Save</button>
                </div>
            </div>
        </div>
    );
}

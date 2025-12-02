// src/app/(dashboard)/admin/sectors/ManageSectorEffectsModal.tsx
'use client';

import React, { useState } from 'react';
import { mutate } from 'swr';
import type { EffectDoc } from '@/models/Effect';
import AddSectorEffectModal from './AddSectorEffectModal';
import EditSectorEffectModal from "./EditSectorEffectModal";
import ModalPortal from "@/components/ModalPortal";

type SectorWithEffects = {
    _id: string;
    name: string;
    effects?: EffectDoc[];
};

export default function ManageSectorEffectsModal({
                                                     sector,
                                                     onClose,
                                                 }: {
    sector: SectorWithEffects;
    onClose: () => void;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [effects, setEffects] = useState<EffectDoc[]>(sector.effects ?? []);
    const [editingEffect, setEditingEffect] = useState<EffectDoc | null>(null);

    // Remove effect from sector
    const removeEffect = async (effectId: string) => {
        await fetch(`/api/sectors/${sector._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ removeEffect: effectId }),
        });

        setEffects(prev => prev.filter(e => String(e._id) !== effectId));
        mutate('/api/sectors');
    };

    // When a NEW effect is created
    const handleEffectCreated = async (newEffectId: string) => {
        await fetch(`/api/sectors/${sector._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addEffect: newEffectId }),
        });

        const updated = await fetch(`/api/sectors/${sector._id}`).then(r => r.json());

        setEffects(updated.effects ?? []);
        mutate('/api/sectors');
        setShowAdd(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-800 p-6 rounded w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl text-white">
                    Manage Effects — {sector.name}
                </h2>

                {/* Existing Effects */}
                <div className="space-y-2 max-h-72 overflow-y-auto">
                    {effects.length === 0 && (
                        <p className="text-gray-400 text-sm">No effects applied.</p>
                    )}

                    {effects.map(e => (
                        <div
                            key={String(e._id)}
                            className="p-2 bg-gray-700 rounded text-white flex justify-between items-center"
                        >
                            <div>
                                <strong>{e.name}</strong> ({e.level}) — {e.kind}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setEditingEffect(e)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => removeEffect(String(e._id))}
                                    className="px-2 py-1 bg-red-600 text-white rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    className="px-3 py-1 bg-indigo-600 rounded text-white"
                >
                    + Add New Effect
                </button>

                {/* Close */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-gray-600 text-white rounded"
                    >
                        Close
                    </button>
                </div>
            </div>

            {showAdd && (
                <ModalPortal>
                    <AddSectorEffectModal
                        sectorId={sector._id}
                        onCreated={handleEffectCreated}
                        onClose={() => setShowAdd(false)}
                    />
                </ModalPortal>
            )}
            {editingEffect && (
                <ModalPortal>
                    <EditSectorEffectModal
                        effect={editingEffect}
                        onClose={() => setEditingEffect(null)}
                        onSaved={async () => {
                            const updated = await fetch(`/api/sectors/${sector._id}`).then(r => r.json());
                            setEffects(updated.effects ?? []);
                            mutate('/api/sectors');
                            setEditingEffect(null);
                        }}
                    />
                </ModalPortal>
            )}
        </div>
    );
}

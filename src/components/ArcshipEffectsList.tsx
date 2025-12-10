// src/components/ArcshipEffectsList.tsx
'use client';

import React from 'react';
import UseEffectChargeButton from '@/components/UseEffectChargeButton';

// Fully typed based on EffectDocument fields you actually use:
export interface ArcshipEffect {
    _id: string;
    name: string;
    level: number;
    description: string;
    kind: 'Positive' | 'Negative' | 'Neutral';
    maxCharges?: number;
    charges?: number;
    chargeInterval?: 'NONE' | 'PHASE' | 'GAME';
}

export default function ArcshipEffectsList({
                                               effects,
                                               isAdmin,
                                           }: {
    effects: ArcshipEffect[];
    isAdmin: boolean;
}) {
    const [list, setList] = React.useState<ArcshipEffect[]>(effects);

    const refreshCharge = (id: string, newCharges: number) => {
        setList(prev =>
            prev.map(e =>
                e._id === id ? { ...e, charges: newCharges } : e
            )
        );
    };

    return (
        <ul className="space-y-2">
            {list.map(fx => {
                const hasCharges =
                    typeof fx.maxCharges === 'number' &&
                    typeof fx.charges === 'number' &&
                    fx.maxCharges > 0;

                const noChargesLeft = hasCharges && fx.charges === 0;

                return (
                    <li
                        key={fx._id}
                        className={`p-2 rounded ${
                            fx.kind === 'Positive'
                                ? 'bg-green-600 text-white'
                                : fx.kind === 'Negative'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-600 text-gray-100'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                                <strong>{fx.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {fx.level}
                                </span>

                                {hasCharges && (
                                    <span
                                        className={`ml-2 text-xs px-1 py-0.5 rounded ${
                                            noChargesLeft ? 'bg-red-900' : 'bg-purple-700'
                                        }`}
                                    >
                                        {fx.charges}/{fx.maxCharges} charges
                                    </span>
                                )}

                                <p className="text-sm break-smart">{fx.description}</p>

                                <div className="mt-1 text-xs">
                                    Interval:{' '}
                                    <strong>{fx.chargeInterval ?? 'NONE'}</strong>
                                </div>
                            </div>

                            {isAdmin && hasCharges && (
                                <UseEffectChargeButton
                                    effectId={fx._id}
                                    onUsed={newCharges => refreshCharge(fx._id, newCharges)}
                                />
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

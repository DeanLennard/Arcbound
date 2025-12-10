// src/components/ArcshipEffectsList.tsx
'use client';

import React from 'react';
import type { Types } from 'mongoose';
import type { PowerLevel } from '@/models/Effect';
import UseEffectChargeButton from '@/components/UseEffectChargeButton';

// Fully typed based on EffectDocument fields you actually use:
export interface ArcshipEffect {
    _id: string | Types.ObjectId;
    name: string;
    level: PowerLevel;
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

    const idToString = (id: string | Types.ObjectId): string =>
        typeof id === 'string' ? id : id.toString();

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
                const id = idToString(fx._id);

                const hasCharges =
                    Number(fx.maxCharges) > 0 && typeof fx.charges === 'number';

                const noChargesLeft = hasCharges && fx.charges === 0;

                return (
                    <li
                        key={id}
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
                                <strong className="block text-lg mb-2">
                                    {fx.name}
                                </strong>
                                <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {fx.level}
                                </span>

                                {hasCharges && (
                                    <span
                                        className={`inline-block ml-2 text-xs px-1 py-0.5 rounded ${
                                            noChargesLeft ? 'bg-red-900' : 'bg-purple-700'
                                        }`}
                                    >
                                        {fx.charges}/{fx.maxCharges} charges
                                        {fx.charges === 0 && ' — NO CHARGES'}
                                        {fx.chargeInterval === 'PHASE' && fx.charges !== 0 && ' per phase'}
                                        {fx.chargeInterval === 'GAME' && fx.charges !== 0 && ' per game'}
                                    </span>
                                )}

                                <p className="mt-1 text-sm break-smart">{fx.description}</p>

                                {isAdmin && hasCharges && (
                                    <UseEffectChargeButton
                                        effectId={id}
                                        onUsed={newCharges => refreshCharge(id, newCharges)}
                                    />
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

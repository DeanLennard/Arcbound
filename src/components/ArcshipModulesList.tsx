// src/components/ArcshipModulesList.tsx
'use client';

import React from "react";
import UseModuleChargeButton from "@/components/UseModuleChargeButton";

export interface ArcshipModule {
    _id: string;
    name: string;
    description: string;
    state: 'Active' | 'Inactive';
    level: string;
    charges?: number;
    maxCharges?: number;
    chargeInterval?: 'NONE' | 'PHASE' | 'GAME';
}

export default function ArcshipModulesList({
                                               modules,
                                               isAdmin
                                           }: {
    modules: ArcshipModule[];
    isAdmin: boolean;
}) {
    const [list, setList] = React.useState(modules);

    const refreshCharge = (id: string, newCharges: number) => {
        setList(prev =>
            prev.map(m => m._id === id ? { ...m, charges: newCharges } : m)
        );
    };

    return (
        <ul className="space-y-2 text-gray-100">
            {list.map(mod => {
                const hasCharges =
                    typeof mod.maxCharges === 'number' &&
                    mod.maxCharges > 0 &&
                    typeof mod.charges === 'number';

                const noChargesLeft = hasCharges && mod.charges === 0;

                return (
                <li
                    key={mod._id}
                    className={`p-2 rounded ${
                        mod.state === 'Active'
                            ? 'bg-green-600 text-white'
                            : mod.state === 'Inactive'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-100'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                            <strong className="block text-lg">
                                {mod.name}
                            </strong>

                            <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                {mod.level}
                            </span>

                            {mod.maxCharges ? (
                                <span
                                    className={`inline-block ml-2 text-xs px-1 py-0.5 rounded ${
                                        mod.charges === 0
                                            ? 'bg-red-900'
                                            : 'bg-purple-700'
                                    }`}
                                >
                                    {mod.charges}/{mod.maxCharges} charges
                                    {noChargesLeft && ' — NO CHARGES'}
                                    {mod.chargeInterval === 'PHASE' && !noChargesLeft  && ' per phase'}
                                    {mod.chargeInterval === 'GAME' && !noChargesLeft  && ' per game'}
                                </span>
                            ) : null}

                            <p className="mt-1 text-sm break-smart">{mod.description}</p>

                            {isAdmin && hasCharges && (
                                <UseModuleChargeButton
                                    moduleId={mod._id}
                                    onUsed={(newCharges) =>
                                        refreshCharge(mod._id, newCharges)
                                    }
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

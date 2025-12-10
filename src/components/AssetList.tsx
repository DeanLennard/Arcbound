// src/components/AssetList.tsx
"use client";

import useSWR from "swr";
import UseChargeButton from "@/components/UseChargeButton";
import type { CharacterAssetClient } from "@/types/CharacterAssetClient";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AssetList({
                                      characterId,
                                      category,
                                      isAdmin
                                  }: {
    characterId: string;
    category: string;
    isAdmin: boolean;
}) {
    const { data, mutate } = useSWR<CharacterAssetClient[]>(
        `/api/character-assets?character=${characterId}&category=${category}`,
        fetcher
    );

    if (!data) return <p>Loading…</p>;

    return (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.map((rel) => (
                <li key={rel._id} className="bg-gray-800 p-4 rounded-lg">
                    <strong className="block text-indigo-300 text-lg mb-2">
                        {rel.name}
                    </strong>

                    <span className="inline-block ml-0 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                        {rel.level}
                    </span>

                    {/* Charges Badge */}
                    {typeof rel.charges === "number" && rel.charges > 0 && (
                        <span
                            className={`ml-2 text-xs px-1 py-0.5 rounded ${
                                (rel.currentCharges ?? rel.charges) === 0
                                    ? "bg-red-700 text-white"
                                    : "bg-purple-600 text-white"
                            }`}
                        >
                            {(rel.currentCharges ?? rel.charges)}/{rel.charges} charges
                            {rel.currentCharges === 0 && ' — NO CHARGES'}
                            {rel.chargeInterval === 'PHASE' && rel.currentCharges !== 0 && ' per phase'}
                            {rel.chargeInterval === 'GAME' && rel.currentCharges !== 0 && ' per game'}
                        </span>
                    )}

                    <p className="text-gray-200 mt-1">{rel.description}</p>

                    {isAdmin && typeof rel.charges === "number" && rel.charges > 0 && (
                        <UseChargeButton
                            assetId={String(rel._id)}
                            onUsed={() => mutate()}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}

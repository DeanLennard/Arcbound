// src/app/(dashboard)/admin/arcships/ArcshipForm.tsx
'use client';
import {useForm, SubmitHandler, Controller} from 'react-hook-form';
import type { SectorDoc } from '@/models/Sector'
import useSWR from "swr";
import React, { useEffect } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json())

// static lists
const FACTIONS = [
    'The Aeon Collective',
    'The Helion Federation',
    'The Korveth Dominion',
    'The Sundered Concord',
    'The Tyr Solaris Imperium',
    'The Virean Ascendancy',
    'Other',
]

type Faction = typeof FACTIONS[number] | string;

interface CoreMetric {
    base: number;
    mod: number;
}

export interface ArcshipFormData {
    _id?: string;
    name: string;
    faction: Faction;
    factionCustom?: string;
    currentSector: string;
    xSector: number
    ySector: number
    benefit: string;
    challenge: string;
    // core metrics
    hull: CoreMetric;
    core: CoreMetric;
    cmd: CoreMetric;
    crew: CoreMetric;
    nav: CoreMetric;
    sense: CoreMetric;
    intc: CoreMetric;
    history?: string;
    // derived‐stat modifiers
    offensiveMod?: number;
    defensiveMod?: number;
    tacticalMod?: number;
    movementInteractionMod?: number;
    movementResolutionMod?: number;
    targetRangeMod?: number;
    shippingItemsMod?: number;
    moduleSlotsMod?: number;
    isCloaked: boolean;
}

interface ArcshipFormProps {
    initial: ArcshipFormData;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ArcshipForm({
        initial,
        onSuccess,
        onCancel,
    }: ArcshipFormProps) {
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { isSubmitting },
    } = useForm<ArcshipFormData>({ defaultValues: initial });

    const { data: sectors } = useSWR<SectorDoc[]>('/api/sectors', fetcher)

    const isEdit = Boolean(initial._id);

    const selectedFaction = watch('faction')

    // watch the sector field
    const watchedSector = watch('currentSector')

    useEffect(() => {
        if (!watchedSector || !sectors) return
        const sel = sectors.find(s => s._id === watchedSector)
        if (sel) {
            setValue('xSector', sel.x, { shouldDirty: true })
            setValue('ySector', sel.y, { shouldDirty: true })
        }
    }, [watchedSector, sectors, setValue])

    const onSubmit: SubmitHandler<ArcshipFormData> = async (data) => {
        // if they chose “Other”…
        if (data.faction === 'Other') data.faction = data.factionCustom!;
        delete data.factionCustom;

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit
            ? `/api/arcships/${initial._id}`
            : '/api/arcships';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) onSuccess();
    };

    const textFields = ['benefit','challenge'] as const;

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 p-6 bg-gray-800 border border-gray-700 rounded-lg"
        >
            {/* Sector picker */}
            <div>
                <label className="block text-sm font-medium text-white">Sector</label>
                <Controller
                    name="currentSector"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <select
                            {...field}
                            onChange={e => {
                                field.onChange(e);
                                const sel = sectors?.find(s => s._id === e.target.value);
                                if (sel) {
                                    setValue('xSector', sel.x);
                                    setValue('ySector', sel.y);
                                }
                            }}
                            className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        >
                            <option value="">— Select Sector —</option>
                            {sectors?.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                />
            </div>

            {/* Hidden X/Y fields (they’ll get their values via setValue above) */}
            <input type="hidden" {...register('xSector', { valueAsNumber: true })} />
            <input type="hidden" {...register('ySector', { valueAsNumber: true })} />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-white">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* Faction */}
                <div>
                    <div>
                        <label className="block text-sm font-medium text-white">Faction</label>
                        <select
                            {...register('faction', { required: true })}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">— Select Faction —</option>
                            {FACTIONS.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        {selectedFaction === 'Other' && (
                            <input
                                {...register('factionCustom', { required: true })}
                                placeholder="Enter custom faction"
                                className="mt-2 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* currentSector, benefit, challenge */}
            <div className="grid grid-cols-3 gap-4">
                {textFields.map((field) => (
                    <div key={field}>
                        <label className="block text-sm font-medium text-white">
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                        </label>
                        {/* now TS knows `field` is one of those three literals */}
                        <input
                            {...register(field)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                ))}
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-3 gap-6">
                {(['hull', 'core', 'cmd', 'crew', 'nav', 'sense', 'intc'] as const).map((key) => (
                    <div key={key}>

                        <label className="block text-xs text-gray-300 uppercase">{key}: Base</label>
                        <input
                            type="number"
                            {...register(`${key}.base`)}
                            className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <label className="block text-xs text-gray-300 mt-2 uppercase">{key}: Mod</label>
                        <input
                            type="number"
                            {...register(`${key}.mod`)}
                            className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                ))}
            </div>

            {/* History */}
            <div>
                <label className="block text-sm font-medium text-white">History</label>
                <textarea
                    {...register('history')}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Derived‐stat modifiers */}
            <section>
                <h3 className="text-lg font-semibold text-white mb-2">
                    Derived Stats Modifiers
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(
                        [
                            ['offensiveMod', 'Offensive FP Δ'],
                            ['defensiveMod', 'Defensive FP Δ'],
                            ['tacticalMod', 'Tactical AP Δ'],
                            ['movementInteractionMod', 'Movement Int Δ'],
                            ['movementResolutionMod', 'Movement Res Δ'],
                            ['targetRangeMod', 'Target Range Δ'],
                            ['shippingItemsMod', 'Shipping Δ'],
                            ['moduleSlotsMod', 'Module Slots Δ'],
                        ] as const
                    ).map(([field, label]) => (
                        <div key={field}>
                            <label className="block text-xs text-gray-300">{label}</label>
                            <input
                                type="number"
                                {...register(field)}
                                className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    ))}
                </div>
            </section>

            <div className="flex space-x-4 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isEdit ? 'Update' : 'Create'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-transparent border border-gray-500 text-gray-300 rounded hover:border-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

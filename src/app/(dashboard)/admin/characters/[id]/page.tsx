// src/app/(dashboard)/admin/characters/[id]/page.tsx
'use client'

import { useParams }              from 'next/navigation'
import React, { useState, useEffect }    from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import useSWR, { mutate }         from 'swr'
import type { AssetCategory } from '@/models/CharacterAsset'
import Editor                     from '@/components/Editor'
import CharacterActions from "@/components/CharacterActions";
import type { CharacterAssetDoc } from '@/models/CharacterAsset'

import AddAssetModal      from './AddAssetModal'
import EditAssetModal     from './EditAssetModal'
import AddPhaseModal      from './AddPhaseModal'
import EditPhaseModal     from './EditPhaseModal'

const fetcher = async (url: string) => {
    const res = await fetch(url)
    // no body → just return an empty array (or whatever sensible default)
    if (res.status === 204 || res.status === 304) return []
    if (!res.ok) {
        // you could also return [] here, or let it throw to show an error UI
        throw new Error(`Fetch error: ${res.status}`)
    }
    return res.json()
}

type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'

export interface CharacterAsset {
    _id:       string
    name:      string
    description:string
    level:     PowerLevel
    state:     'Active'|'Inactive'
    apcost:    number
    ebcost:    number
    buildType?: 'ITEM'|'IMPLANT'
    buildCredits?: number
    buildAlloys?: number
    buildEnergy?: number
    buildData?: number
    buildEssence?: number
    category:  AssetCategory
}

interface Phase {
    _id:        string
    number:     number
    interaction:string
    gambit:     string
    resolution: string
}

interface CharacterForm {
    charName:        string
    status:          'Active'|'Dead'|'Retired'
    AdditionalArcships: string[]
    faction:         string
    archetype:       string
    ascPoints:       { spent: number; remaining: number }
    essenceBurn:     { spent: number; remaining: number }
    credits:         number
    legacythreads:   number
    background:      string
    factionObjective:string
}

interface Arcship {
    _id: string
    name: string
}

export default function AdminCharacterDetail() {
    const { id } = useParams() as { id: string }

    const { data: char, error: charErr } = useSWR<CharacterForm>(`/api/characters/${id}`, fetcher)
    const { data: phases, error: phasesErr } = useSWR<Phase[]>(`/api/characters/${id}/phases`, fetcher)
    const { data: allArcs } = useSWR<Arcship[], Error>(
        '/api/arcships',
        (url: string) => fetch(url).then(r => r.json() as Promise<Arcship[]>)
    )

    // lists
    const assetCategories: { key: AssetCategory; label: string }[] = [
        { key:'Tag',           label:'Tag'           },
        { key:'Item',           label:'Items'           },
        { key:'Shard',          label:'Shards'          },
        { key:'Resistance',     label:'Resistances'     },
        { key:'Weakness',       label:'Weaknesses'      },
        { key:'OtherEffect',    label:'Other Effects'   },
        { key:'ThreatLedger',   label:'Threat Ledger'        },
        { key:'Implant',        label:'Implants'        },
        { key:'ThresholdForm',  label:'Threshold Forms' },
        { key:'GenomeThread',   label:'Genome Threads'  },
        { key:'VitalSignature', label:'Vital Signatures'},
        { key:'Ritual',         label:'Codified Rituals'},
        { key:'Scrapcode',      label:'Scrapcode Compendium'}
    ]

    const tagRes        = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Tag`,        fetcher)
    const itemsRes        = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Item`,        fetcher)
    const shardsRes       = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Shard`,       fetcher)
    const resistancesRes  = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Resistance`,  fetcher)
    const weaknessesRes   = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Weakness`,    fetcher)
    const otherEffectsRes = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=OtherEffect`,fetcher)
    const threatLedgerRes     = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=ThreatLedger`,    fetcher)
    const implantsRes     = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Implant`,    fetcher)
    const thresholdRes    = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=ThresholdForm`,fetcher)
    const genomeRes       = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=GenomeThread`, fetcher)
    const vitalRes        = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=VitalSignature`,fetcher)
    const ritualsRes      = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Ritual`,       fetcher)
    const scrapRes        = useSWR<CharacterAssetDoc[]>(`/api/character-assets?character=${id}&category=Scrapcode`,   fetcher)

    const assetsByCat: Record<AssetCategory, CharacterAssetDoc[]> = {
        Tag:            tagRes.data          || [],
        Item:           itemsRes.data        || [],
        Shard:          shardsRes.data       || [],
        Resistance:     resistancesRes.data  || [],
        Weakness:       weaknessesRes.data   || [],
        ThreatLedger:   threatLedgerRes.data || [],
        OtherEffect:    otherEffectsRes.data || [],
        Implant:        implantsRes.data     || [],
        ThresholdForm:  thresholdRes.data    || [],
        GenomeThread:   genomeRes.data       || [],
        VitalSignature: vitalRes.data        || [],
        Ritual:         ritualsRes.data      || [],
        Scrapcode:      scrapRes.data        || [],
    }

    // modal state, properly typed
    const [addingAssetFor, setAddingAssetFor] = useState<AssetCategory| null>(null)
    const [editingAsset, setEditingAsset]     = useState<CharacterAssetDoc | null>(null)
    const [showPhase, setShowPhase]           = useState(false)
    const [editingPhase, setEditingPhase]     = useState<Phase | null>(null)
    const [local, setLocal] = useState<string[]>([])

    // form
    const { register, handleSubmit, reset, formState, watch, setValue } = useForm<CharacterForm>({
        defaultValues: char
    })

    useEffect(() => {
        if (!char) return;
        reset(char);                            // RHF defaultValues
        setLocal(char.AdditionalArcships || []); // seed your local array
    }, [char, reset]);

    const background        = watch('background')        || ''
    const factionObjective  = watch('factionObjective')  || ''

    const onSubmit: SubmitHandler<CharacterForm> = async data => {
        await fetch(`/api/characters/${id}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        })
        mutate(`/api/characters/${id}`)
    }

    const add = (idToAdd: string) => {
        const next = [...local, idToAdd];
        setLocal(next);
        setValue("AdditionalArcships", next, { shouldDirty: true });
    };

    const remove = (idToRemove: string) => {
        const next = local.filter(id => id !== idToRemove);
        setLocal(next);
        setValue("AdditionalArcships", next, { shouldDirty: true });
    };

    const idToName = React.useMemo(() => {
        const map: Record<string,string> = {}
        allArcs?.forEach(a => map[a._id] = a.name)
        return map
    }, [allArcs])

    if (charErr || phasesErr) return <p className="p-6 text-red-400">Error loading</p>
    if (!char)                 return <p className="p-6">Loading…</p>
    if (!allArcs) return <p>Loading arcships…</p>

    const available = allArcs.filter(a => !local.includes(a._id))

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">{char.charName} — Manage</h1>

            {/* 1) Core & resources */}
            <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-800 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-white">Name</label>
                        <input {...register('charName',{required:true})}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm text-white">Status</label>
                        <select {...register('status')} className="mt-1 w-full p-2 bg-gray-700 text-white rounded">
                            <option>Active</option><option>Dead</option><option>Retired</option><option>NPC</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm text-white">Additional Arcships</label>
                    <div className="flex flex-wrap gap-2">
                        {local.map(id => (
                            <span key={id} className="bg-indigo-600 text-white px-2 py-1 rounded flex items-center space-x-1">
                                {idToName[id]}
                                <button type="button" onClick={() => remove(id)}>×</button>
                            </span>
                        ))}
                    </div>

                    <select
                        value=""
                        onChange={e => {
                            if (!e.target.value) return;
                            add(e.target.value);
                        }}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">— Add another ship —</option>
                        {available.map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-white">AP Spent</label>
                        <input type="number" {...register('ascPoints.spent')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm text-white">AP Total</label>
                        <input type="number" {...register('ascPoints.remaining')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-white">EB Spent</label>
                        <input type="number" {...register('essenceBurn.spent')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm text-white">EB Total</label>
                        <input type="number" {...register('essenceBurn.remaining')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-white">Credits</label>
                        <input type="number" {...register('credits')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm text-white">Legacy Threads</label>
                        <input type="number" {...register('legacythreads')}
                               className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-white">Background</label>
                        <Editor
                            value={background}
                            onChange={html => setValue('background', html)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white">Faction Objective</label>
                        <Editor
                            value={factionObjective}
                            onChange={html => setValue('factionObjective', html)}
                        />
                    </div>
                </div>

                <button type="submit"
                        disabled={formState.isSubmitting}
                        className="btn-sm bg-blue-600 text-white px-4 py-2 rounded">
                    Save Character
                </button>
            </form>

            {/* ─── CHAR & ARCSHIP TRANSFERS ───────────────────────────── */}
            <CharacterActions
                characterId={id}
                credits={char.credits}
            />

            {/* 2) All the little relation‐lists with “+ Add” */}
            {assetCategories.map(({key,label}) => (
                <section key={key}>
                    <h2 className="text-2xl">{label}</h2>
                    <ul className="space-y-1">
                        {assetsByCat[key].map(a=>(
                            <li key={String(a._id)} className="flex justify-between bg-gray-800 p-2 rounded">
                                <div className="pr-4 flex-1">
                                    <strong>{a.name}</strong>
                                    <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                        {a.level}
                                    </span>
                                    <span
                                        className={`
                                            ml-2
                                            text-xs px-1 py-0.5 rounded
                                            ${a.state === 'Active'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-red-600 text-white'
                                            }
                                        `}
                                                                >
                                        {a.state}
                                    </span>
                                    {typeof a.apcost === 'number' && a.apcost > 0 && (
                                        <span className="ml-2 text-xs px-1 py-0.5 bg-amber-500 text-white rounded">
                                            {a.apcost} AP
                                        </span>
                                    )}

                                    {typeof a.ebcost === 'number' && a.ebcost > 0 && (
                                        <span className="ml-2 text-xs px-1 py-0.5 bg-teal-500 text-white rounded">
                                            {a.ebcost} EB
                                        </span>
                                    )}
                                    <p className="text-gray-200">{a.description}</p>
                                </div>
                                <div className="flex-none flex space-x-1 whitespace-nowrap">
                                    <button
                                        className="btn-sm bg-blue-600 text-white px-2 py-1 rounded cursor-pointer"
                                        onClick={() => setEditingAsset(a)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn-sm bg-red-600 text-white px-2 py-1 rounded cursor-pointer"
                                        onClick={async () => {
                                            await fetch(`/api/character-assets/${a._id}`, { method: 'DELETE' });
                                            mutate(`/api/character-assets?character=${id}&category=${key}`);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <button
                        className="btn mt-2"
                        onClick={() => setAddingAssetFor(key)}
                    >
                        + Add {label}
                    </button>
                </section>
            ))}

            {/* 3) Phase History in three-column cards */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Phase History</h2>
                <button className="btn-sm bg-green-600 text-white px-2 py-1 rounded"
                        onClick={()=>setShowPhase(true)}>
                    + New Phase
                </button>

                {phases!.map(ph => (
                    <div key={String(ph._id)} className="bg-gray-800 p-4 rounded-lg space-y-4">
                        <div className="flex justify-between">
                            <h4 className="text-indigo-300 font-semibold">Phase {ph.number}</h4>
                            <button
                                className="btn-sm bg-blue-600 text-white px-2 py-1 rounded cursor-pointer"
                                onClick={() => setEditingPhase(ph)}
                            >
                                Edit
                            </button>
                        </div>

                        {/* Interaction */}
                        <div>
                            <p className="font-semibold text-gray-200 mb-1">Interaction</p>
                            <div
                                className="prose prose-sm prose-white max-w-none tiptap"
                                dangerouslySetInnerHTML={{ __html: ph.interaction }}
                            />
                        </div>

                        {/* Gambit */}
                        <div>
                            <p className="font-semibold text-gray-200 mb-1">Gambit</p>
                            <div
                                className="prose prose-sm prose-white max-w-none tiptap"
                                dangerouslySetInnerHTML={{ __html: ph.gambit }}
                            />
                        </div>

                        {/* Resolution */}
                        <div>
                            <p className="font-semibold text-gray-200 mb-1">Resolution</p>
                            <div
                                className="prose prose-sm prose-white max-w-none tiptap"
                                dangerouslySetInnerHTML={{ __html: ph.resolution }}
                            />
                        </div>
                    </div>
                ))}
            </section>

            {/* All the Modals */}
            {addingAssetFor && (
                <AddAssetModal
                    charId={id}
                    category={addingAssetFor}
                    onClose={() => setAddingAssetFor(null)}
                />
            )}
            {editingAsset && (
                <EditAssetModal
                    asset={editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onSaved={() => {
                        // re-fetch the current category:
                        mutate(
                            `/api/character-assets?character=${id}&category=${editingAsset.category}`
                        )
                        setEditingAsset(null)
                    }}
                />
            )}
            {showPhase       && <AddPhaseModal          charId={id} onClose={()=>setShowPhase(false)} />}
            {editingPhase && (
                <EditPhaseModal
                    phase={editingPhase}
                    charId={id}
                    onClose={() => setEditingPhase(null)}
                />
            )}
        </div>
    )
}

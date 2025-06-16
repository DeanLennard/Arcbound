// src/app/(dashboard)/admin/characters/[id]/page.tsx
'use client'

import { useParams }              from 'next/navigation'
import { useState, useEffect }    from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import useSWR, { mutate }         from 'swr'
import {AssetCategory} from "@/models/CharacterAsset";

import AddAssetModal            from './AddAssetModal'
import AddPhaseModal           from './AddPhaseModal'
import EditAssetModal from './EditAssetModal'
import EditPhaseModal           from './EditPhaseModal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface CharacterForm {
    charName: string
    status:    'Active'|'Dead'|'Retired'
    faction:   string
    archetype: string

    ascPoints:       { spent: number; remaining: number }
    essenceBurn:     { spent: number; remaining: number }
    credits:         number

    background:      string
    factionObjective:string
}

export default function AdminCharacterDetail() {
    const { id } = useParams()
    const { data: char, error } = useSWR<CharacterForm>(`/api/characters/${id}`, fetcher)
    const { data: phases }    = useSWR<any[]>(`/api/characters/${id}/phases`,    fetcher)

    // lists
    const assetCategories: { key: AssetCategory; label: string }[] = [
        { key:'Item',           label:'Items'           },
        { key:'Shard',          label:'Shards'          },
        { key:'Resistance',     label:'Resistances'     },
        { key:'Weakness',       label:'Weaknesses'      },
        { key:'OtherEffect',    label:'Other Effects'   },
        { key:'Implant',        label:'Implants'        },
        { key:'ThresholdForm',  label:'Threshold Forms' },
        { key:'GenomeThread',   label:'Genome Threads'  },
        { key:'VitalSignature', label:'Vital Signatures'},
        { key:'Ritual',         label:'Codified Rituals'},
        { key:'Scrapcode',      label:'Scrapcode Compendium'}
    ]

    // modals
    const [showPhase, setShowPhase]             = useState(false)
    const [addingAssetFor, setAddingAssetFor] = useState<AssetCategory | null>(null);
    const [editingAsset,   setEditingAsset]   = useState<any>(null)
    const [editingPhase, setEditingPhase] = useState<any>(null)

    // form
    const { register, handleSubmit, reset, formState } = useForm<CharacterForm>({
        defaultValues: char
    })
    useEffect(() => { if (char) reset(char) }, [char, reset])

    const onSubmit: SubmitHandler<CharacterForm> = async data => {
        await fetch(`/api/characters/${id}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        })
        mutate(`/api/characters/${id}`)
    }

    // Fetch them with one hook per category:
    const assetsByCat = Object.fromEntries(
        assetCategories.map(({key}) => [
            key,
            useSWR(`/api/character-assets?character=${id}&category=${key}`, fetcher).data||[]
        ])
    )

    if (error) return <p className="text-red-400 p-6">Error loading</p>
    if (!char)  return <p className="p-6">Loading…</p>

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
                            <option>Active</option><option>Dead</option><option>Retired</option>
                        </select>
                    </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-white">Background</label>
                        <textarea {...register('background')} rows={3}
                                  className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm text-white">Faction Objective</label>
                        <textarea {...register('factionObjective')} rows={3}
                                  className="mt-1 w-full p-2 bg-gray-700 text-white rounded"/>
                    </div>
                </div>

                <button type="submit"
                        disabled={formState.isSubmitting}
                        className="btn-sm bg-blue-600 text-white px-4 py-2 rounded">
                    Save Character
                </button>
            </form>

            {/* 2) All the little relation‐lists with “+ Add” */}
            {assetCategories.map(({key,label}) => (
                <section key={key}>
                    <h2 className="text-2xl">{label}</h2>
                    <ul className="space-y-1">
                        {assetsByCat[key].map(a=>(
                            <li key={a._id} className="flex justify-between bg-gray-800 p-2 rounded">
                                <div>
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
                                <div className="space-x-1">
                                    <button
                                        className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                                        onClick={() => setEditingAsset(a)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
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

                {phases?.map((ph: any) => (
                    <div
                        key={ph._id}
                        className="bg-gray-800 p-4 rounded-lg space-y-4"
                    >
                        {/* Phase header */}
                        <div className="flex justify-between items-center">
                            <h4 className="text-indigo-300 font-semibold">
                                Phase {ph.number}
                            </h4>
                            <button
                                className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
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

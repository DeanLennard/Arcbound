// src/app/(dashboard)/admin/arcships/[id]/page.tsx
'use client'
import { useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useForm }       from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import type { EventLogDoc }        from '@/models/EventLog'
import AddModuleModal    from './AddModuleModal'
import AddEffectModal    from './AddEffectModal'
import AddDiplomacyModal    from './AddDiplomacyModal'
import AddEventLogModal from './AddEventLogModal'
import EditEffectModal    from './EditEffectModal'
import EditModuleModal from './EditModuleModal';
import EditDiplomacyModal from './EditDiplomacyModal'
import EditEventLogModal from './EditEventLogModal'
import { prepareHtmlForFrontend } from '@/lib/prepareHtmlForFrontend';

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Arcship {
    _id: string
    name: string
    faction: string
    currentSector: string
    benefit: string
    challenge: string
    // … core metrics …
    hull: { base:number; mod:number }
    core: { base:number; mod:number }
    cmd:  { base:number; mod:number }
    crew: { base:number; mod:number }
    nav:  { base:number; mod:number }
    sense:{ base:number; mod:number }
    intc: { base:number; mod:number }
    // … rest of your schema …
    alloysBalance:  number
    energyBalance:  number
    dataBalance:    number
    essenceBalance: number
    creditsBalance: number

    history: string
    offensiveMod?: number
    defensiveMod?: number
    tacticalMod:            number
    movementInteractionMod: number
    movementResolutionMod:  number
    targetRangeMod:         number
    shippingItemsMod:       number
    moduleSlotsMod:         number
}

type StatField =
    | 'offensiveMod'
    | 'defensiveMod'
    | 'tacticalMod'
    | 'movementInteractionMod'
    | 'movementResolutionMod'
    | 'targetRangeMod'
    | 'shippingItemsMod'
    | 'moduleSlotsMod'

const derivedStats: { field: StatField; label: string }[] = [
    { field: 'offensiveMod',           label: 'Offensive Δ' },
    { field: 'defensiveMod',           label: 'Defensive Δ' },
    { field: 'tacticalMod',            label: 'Tactical Δ'  },
    { field: 'movementInteractionMod', label: 'Mvmt Int Δ' },
    { field: 'movementResolutionMod',  label: 'Mvmt Res Δ'  },
    { field: 'targetRangeMod',         label: 'Range Δ'     },
    { field: 'shippingItemsMod',       label: 'Shipping Δ'  },
    { field: 'moduleSlotsMod',         label: 'Module Slots Δ' },
]

const RESOURCE_FIELDS = [
    ['alloysBalance',  'Alloys Balance'],
    ['energyBalance',  'Energy Balance'],
    ['dataBalance',    'Data Balance'],
    ['essenceBalance', 'Essence Balance'],
    ['creditsBalance', 'Credits Balance'],
] as const

interface ModuleDoc {
    _id: string
    name: string
    description: string
    state: 'Active' | 'Inactive'
    level: 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'
    attachedTo: string;
}
interface EffectDoc {
    _id: string
    name: string
    description: string
    kind: 'Positive'|'Neutral'|'Negative'
    level: 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'
}
interface DiplomacyDoc {
    _id: string
    name: string
    description: string
    type: 'Trade Agreement' | 'Non Aggression Pact' | 'Alliance' | 'War' | 'Total Annihilation' | 'Vassal'
    level: 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'
    ships: { _id: string; name: string }[]
}

export default function AdminArcshipDetail() {
    const params = useParams()
    // always call it:
    const id = typeof params?.id === 'string' ? params.id : null

    const { data: ship,    error: shipErr    } = useSWR<Arcship>(() => id ? `/api/arcships/${id}` : null, fetcher)
    const { data: mods,    error: modsErr    } = useSWR<ModuleDoc[]>(() => id ?    `/api/modules?attachedTo=${id}` : null, fetcher)
    const { data: effects, error: effectsErr } = useSWR<EffectDoc[]>(() => id ?    `/api/effects?ship=${id}` : null,     fetcher)
    const { data: diplo,   error: diploErr   } = useSWR<DiplomacyDoc[]>(() => id ? `/api/diplomacy?ship=${id}` : null, fetcher)
    const { data: logs,    error: logsErr    } = useSWR<EventLogDoc[]>(() => id ? `/api/eventlog?arcship=${id}` : null, fetcher)
    const [showModuleModal,    setShowModule]    = useState(false)
    const [showEffectModal,    setShowEffect]    = useState(false)
    const [showDiplomacyModal, setShowDiplomacy] = useState(false)
    const [showEventLogModal, setShowEventLogModal ] = useState(false)
    const [selectedEffect,       setSelectedEffect]       = useState<EffectDoc | null>(null)
    const [showEditEffectModal,  setShowEditEffectModal]  = useState(false)
    const [selectedModule,       setSelectedModule]       = useState<ModuleDoc | null>(null)
    const [showEditModuleModal,  setShowEditModuleModal]  = useState(false)
    const [selectedDip, setSelectedDip] = useState<DiplomacyDoc | null>(null)
    const [showEditDipModal, setShowEditDipModal] = useState(false)
    const [selectedLog, setSelectedLog] = useState<EventLogDoc | null>(null)
    const [showEditLogModal, setShowEditLogModal] = useState(false)

    // hook up RHF
    const { register, handleSubmit, reset, formState } = useForm<Arcship>({
        defaultValues: ship
    })

    // whenever `ship` changes, reset the form
    useEffect(() => {
        if (ship) reset(ship)
    }, [ship, reset])

    const onSubmit = handleSubmit(async (data) => {
        await fetch(`/api/arcships/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(data),
        })
        mutate(`/api/arcships/${id}`)
    })

    if (id === null) return <p className="p-6 text-red-400">Missing or invalid arcship ID</p>
    if (shipErr || modsErr || effectsErr || diploErr || logsErr) return <p className="p-6 text-red-400">Error loading data</p>
    if (!ship || !mods || !effects || !diplo || !logs)     return <p className="p-6">Loading…</p>

    const simpleFields = ['currentSector', 'benefit', 'challenge'] as const;
    type SimpleField = typeof simpleFields[number];

    const metricKeys = ['hull','core','cmd','crew','nav','sense','intc'] as const;
    type MetricKey = typeof metricKeys[number];

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">{ship.name} — Manage</h1>

            {/* 1) Core & history & modifiers */}
            <form onSubmit={onSubmit} className="space-y-6">
                {/* Name + Faction */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-white">Name</label>
                        <input
                            {...register('name',{required:true})}
                            className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Faction</label>
                        <input
                            {...register('faction')}
                            className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        />
                    </div>
                </div>

                {/* currentSector, benefit, challenge */}
                <div className="grid grid-cols-3 gap-4">
                    {simpleFields.map((f: SimpleField) => (
                        <div key={f}>
                            <label className="block text-sm font-medium text-white">
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </label>
                            {/* now register knows f is exactly one of those three */}
                            <input
                                {...register(f)}
                                className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                            />
                        </div>
                    ))}
                </div>

                {/* Core metrics */}
                <div className="grid grid-cols-3 gap-6">
                    {metricKeys.map((key: MetricKey) => (
                        <div key={key}>
                            <h4 className="text-white font-semibold mb-1">{key.toUpperCase()}</h4>
                            <label className="block text-xs text-gray-300">Base</label>
                            <input
                                type="number"
                                {...register(`${key}.base` as const)}
                                className="block w-full p-1 bg-gray-700 text-white rounded"
                            />
                            <label className="block text-xs text-gray-300 mt-2">Mod</label>
                            <input
                                type="number"
                                {...register(`${key}.mod` as const)}
                                className="block w-full p-1 bg-gray-700 text-white rounded"
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
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                </div>

                {/* Persisted Resource Balances */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Resource Balances
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {RESOURCE_FIELDS.map(([field, label]) => (
                            <div key={field}>
                                <label className="block text-xs text-gray-300">{label}</label>
                                <input
                                    type="number"
                                    {...register(field, { required: true, min: 0 })}
                                    className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white
                     border border-gray-600 rounded focus:outline-none
                     focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Derived‐stat Modifiers */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Derived Stats Modifiers
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {derivedStats.map(({ field, label }) => (
                            <div key={field}>
                                <label
                                    htmlFor={field}
                                    className="block text-xs text-gray-300"
                                >
                                    {label}
                                </label>
                                <input
                                    id={field}
                                    type="number"
                                    {...register(field)}
                                    className="mt-1 w-full p-1 bg-gray-700 text-white rounded"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={formState.isSubmitting}
                    className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                >
                    Save Core & Modifiers
                </button>
            </form>

            {/* 2) Modules */}
            <section>
                <h2 className="text-xl font-semibold">Modules</h2>
                <ul className="space-y-2">
                    {mods.map(m => (
                        <li
                            key={m._id}
                            className={`
                                    flex justify-between p-2 rounded
                                    ${m.state === 'Active'   ? 'bg-green-600 text-white'
                                    : m.state === 'Inactive' ? 'bg-red-600   text-white'
                                    : 'bg-gray-800 text-gray-100'}
                                `}
                        >
                            <div className="pr-4 flex-1">
                                <strong>{m.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {m.level}
                                </span>
                                <p className="text-sm">{m.description}</p>
                            </div>
                            <div className="flex-none flex space-x-1 whitespace-nowrap">
                                <button
                                    className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                                    onClick={() => {
                                        setSelectedModule(m)
                                        setShowEditModuleModal(true)
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        await fetch(`/api/modules/${m._id}`, {
                                            method:'DELETE',
                                            headers:{'Content-Type':'application/json'},
                                            body: JSON.stringify({ attachedTo: null })
                                        })
                                        mutate(`/api/modules?attachedTo=${id}`)
                                    }}
                                >
                                    Unattach
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button className="btn mt-2" onClick={()=>setShowModule(true)}>+ Attach Module</button>
            </section>

            {showModuleModal && (
                <AddModuleModal arcshipId={id} onClose={()=>setShowModule(false)} />
            )}
            {selectedModule && showEditModuleModal && (
                <EditModuleModal
                    module={selectedModule}
                    arcshipId={id!}
                    isOpen={showEditModuleModal}
                    onClose={() => setShowEditModuleModal(false)}
                />
            )}
            {/* 3) Effects */}
            <section>
                <h2 className="text-xl font-semibold">Effects</h2>
                <ul className="space-y-2">
                    {effects.map(ef => (
                        <li
                            key={ef._id}
                            className={`
                                    flex justify-between p-2 rounded 
                                    ${ef.kind === 'Positive' ? 'bg-green-600 text-white'
                                    : ef.kind === 'Negative'   ? 'bg-red-600   text-white'
                                    : 'bg-gray-600 text-gray-100'}
                                `}
                        >
                            <div className="pr-4 flex-1">
                                <strong>{ef.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {ef.level}
                                </span>
                                <p className="text-sm">{ef.description}</p>
                                <div className="mt-1 text-xs">
                                    Status:{' '}
                                    <span>{ef.kind}</span>
                                </div>
                            </div>
                            <div className="flex-none flex space-x-1 whitespace-nowrap">
                                <button
                                    className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                                    onClick={() => {
                                        setSelectedEffect(ef)
                                        setShowEditEffectModal(true)
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        await fetch(`/api/effects/${ef._id}`, {
                                            method: 'DELETE',
                                            headers: {'Content-Type':'application/json'},
                                            body: JSON.stringify({ ships: { remove: id } })
                                        });
                                        mutate(`/api/effects?ship=${id}`);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button className="btn mt-2" onClick={()=>setShowEffect(true)}>+ Attach Effect</button>
            </section>

            {showEffectModal && (
                <AddEffectModal arcshipId={id} onClose={()=>setShowEffect(false)} />
            )}
            {selectedEffect && showEditEffectModal && (
                <EditEffectModal
                    isOpen={showEditEffectModal}
                    onClose={() => setShowEditEffectModal(false)}
                    effect={selectedEffect}
                    arcshipId={id!}
                    mutateEffectList={() => mutate(`/api/effects?ship=${id}`)}
                />
            )}
            {/* 4) Diplomacy */}
            <section>
                <h2 className="text-xl font-semibold">Diplomatic Arrangements</h2>
                <ul className="space-y-2">
                    {diplo.map(d => (
                        <li key={d._id} className="bg-gray-800 p-4 rounded flex justify-between items-start">
                            <div className="pr-4 flex-1">
                                <strong className="text-white">{d.name}<em> ({d.type})</em></strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {d.level}
                                </span>
                                <div
                                    className="text-sm text-gray-300 tiptap break-smart"
                                    dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(d.description) }}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Partners:{' '}
                                    {d.ships
                                        .filter(s => s._id !== id)          // drop the current ship
                                        .map(s => s.name)
                                        .join(', ') || 'None'}
                                </p>
                            </div>
                            <div className="flex-none flex space-x-1 whitespace-nowrap">
                                <button
                                    className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                                    onClick={() => {
                                        setSelectedDip(d)
                                        setShowEditDipModal(true)
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                    onClick={async e => {
                                        e.preventDefault()
                                        await fetch(`/api/diplomacy/${d._id}`, { method: 'DELETE' })
                                        mutate(`/api/diplomacy?ship=${id}`)
                                    }}
                                >
                                    End
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button className="btn mt-2" onClick={() => setShowDiplomacy(true)}>
                    + New Arrangement
                </button>
            </section>

            {showDiplomacyModal && (
                <AddDiplomacyModal arcshipId={id} onClose={()=>setShowDiplomacy(false)} />
            )}
            {selectedDip && showEditDipModal && (
                <EditDiplomacyModal
                    diplomacy={selectedDip}
                    onClose={() => setShowEditDipModal(false)}
                />
            )}

            {/* 5) Event Logs */}
            <section>
                <h2 className="text-xl font-semibold">Event Log</h2>
                <ul className="space-y-2">
                    {logs.map(l => (
                        <li key={String(l._id)} className="bg-gray-800 p-2 rounded flex justify-between">
                            <div className="pr-4 flex-1">
                                <strong className="text-white">{l.eventName}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {l.level}
                                </span>
                                <p className="text-gray-300">{l.effect}</p>
                                <div className="text-sm text-gray-400">
                                    Phase: {l.phase} • Ongoing: {l.ongoing ? 'Yes' : 'No'}
                                </div>
                            </div>
                            <div className="flex-none flex space-x-1 whitespace-nowrap">
                                <button
                                    className="btn-sm bg-blue-600 text-white px-2 py-1 rounded"
                                    onClick={() => {
                                        setSelectedLog(l)
                                        setShowEditLogModal(true)
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                    onClick={async e => {
                                        e.preventDefault()
                                        await fetch(`/api/eventlog/${l._id}`, { method: 'DELETE' })
                                        mutate(`/api/eventlog?arcship=${id}`)
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button
                    className="btn mt-2"
                    onClick={() => setShowEventLogModal(true)}
                >
                    + Add Event Log
                </button>
            </section>

            {showEventLogModal && (
                <AddEventLogModal
                    arcshipId={id}
                    onClose={() => setShowEventLogModal(false)}
                />
            )}
            {selectedLog && showEditLogModal && (
                <EditEventLogModal
                    arcshipId={id!}
                    log={selectedLog}
                    isOpen={showEditLogModal}
                    onClose={() => setShowEditLogModal(false)}
                />
            )}
        </div>
    )
}
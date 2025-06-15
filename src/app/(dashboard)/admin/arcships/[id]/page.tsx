// src/app/(dashboard)/admin/arcships/[id]/page.tsx (client component)
'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm }       from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import AddModuleModal    from './AddModuleModal'
import AddEffectModal    from './AddEffectModal'
import AddDiplomacyModal    from './AddDiplomacyModal'
import AddEventLogModal from './AddEventLogModal'

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

interface ModuleDoc {
    _id: string
    name: string
    description: string
    level: string
}
interface EffectDoc {
    _id: string
    name: string
    description: string
    level: string
}
interface DiplomacyDoc {
    _id: string
    name: string
    description: string
    type: string
    level: string
    ships: { _id: string; name: string }[]
}
interface EventLogDoc {
    _id: string
    eventName: string
    effect: string
    phase: string
    level: string
    ongoing: boolean
}

export default function AdminArcshipDetail() {
    const { id } = useParams()

    const { data: ship,    error: shipErr    } = useSWR<Arcship>(`/api/arcships/${id}`, fetcher)
    const { data: mods,    error: modsErr    } = useSWR<ModuleDoc[]>(   `/api/modules?attachedTo=${id}`, fetcher)
    const { data: effects, error: effectsErr } = useSWR<EffectDoc[]>(   `/api/effects?ship=${id}`,     fetcher)
    const { data: diplo,   error: diploErr   } = useSWR<DiplomacyDoc[]>(`/api/diplomacy?ship=${id}`, fetcher)
    const { data: logs,    error: logsErr    } = useSWR<EventLogDoc[]>(`/api/eventlog?arcship=${id}`, fetcher)
    const [showModuleModal,    setShowModule]    = useState(false)
    const [showEffectModal,    setShowEffect]    = useState(false)
    const [showDiplomacyModal, setShowDiplomacy] = useState(false)
    const [ showEventLogModal, setShowEventLogModal ] = useState(false)

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

    if (shipErr || modsErr || effectsErr || diploErr || logsErr) return <p className="p-6 text-red-400">Error loading data</p>
    if (!ship || !mods || !effects || !diplo || !logs)     return <p className="p-6">Loading…</p>

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
                    {['currentSector','benefit','challenge'].map(f => (
                        <div key={f}>
                            <label className="block text-sm font-medium text-white">
                                {f.charAt(0).toUpperCase()+f.slice(1)}
                            </label>
                            <input
                                {...register(f as any)}
                                className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                            />
                        </div>
                    ))}
                </div>

                {/* Core metrics */}
                <div className="grid grid-cols-3 gap-6">
                    {(['hull','core','cmd','crew','nav','sense','intc'] as const).map(key => (
                        <div key={key}>
                            <h4 className="text-white font-semibold mb-1">{key.toUpperCase()}</h4>
                            <label className="block text-xs text-gray-300">Base</label>
                            <input type="number" {...register(`${key}.base` as any)} className="block w-full p-1 bg-gray-700 text-white rounded"/>
                            <label className="block text-xs text-gray-300 mt-2">Mod</label>
                            <input type="number" {...register(`${key}.mod` as any)} className="block w-full p-1 bg-gray-700 text-white rounded"/>
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

                {/* Derived‐stat Modifiers */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-2">Derived Stats Modifiers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            ['offensiveMod',           'Offensive Δ'],
                            ['defensiveMod',           'Defensive Δ'],
                            ['tacticalMod',            'Tactical Δ'],
                            ['movementInteractionMod', 'Mvmt Int Δ'],
                            ['movementResolutionMod',  'Mvmt Res Δ'],
                            ['targetRangeMod',         'Range Δ'],
                            ['shippingItemsMod',       'Shipping Δ'],
                            ['moduleSlotsMod',         'Module Slots Δ'],
                        ].map(([f,label])=>(
                            <div key={f}>
                                <label className="block text-xs text-gray-300">{label}</label>
                                <input
                                    type="number"
                                    {...register(f as any)}
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
                        <li key={m._id} className="flex justify-between bg-gray-800 p-2 rounded">
                            <div>
                                <strong>{m.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {m.level}
                                </span>
                                <p className="text-sm">{m.description}</p>
                            </div>
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
                        </li>
                    ))}
                </ul>
                <button className="btn mt-2" onClick={()=>setShowModule(true)}>+ Attach Module</button>
            </section>

            {showModuleModal && (
                <AddModuleModal arcshipId={id} onClose={()=>setShowModule(false)} />
            )}
            {/* 3) Effects */}
            <section>
                <h2 className="text-xl font-semibold">Effects</h2>
                <ul className="space-y-2">
                    {effects.map(ef => (
                        <li key={ef._id} className="flex justify-between bg-gray-800 p-2 rounded">
                            <div>
                                <strong>{ef.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {ef.level}
                                </span>
                                <p className="text-sm">{ef.description}</p>
                            </div>
                            <button
                                className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                onClick={async (e) => {
                                    e.preventDefault()
                                    await fetch(`/api/effects/${ef._id}`, {
                                        method: 'PUT',
                                        headers: {'Content-Type':'application/json'},
                                        body: JSON.stringify({ ships: { remove: id } })
                                    });
                                    mutate(`/api/effects?ship=${id}`);
                                }}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <button className="btn mt-2" onClick={()=>setShowEffect(true)}>+ Attach Effect</button>
            </section>

            {showEffectModal && (
                <AddEffectModal arcshipId={id} onClose={()=>setShowEffect(false)} />
            )}
            {/* 4) Diplomacy */}
            <section>
                <h2 className="text-xl font-semibold">Diplomatic Arrangements</h2>
                <ul className="space-y-2">
                    {diplo.map(d => (
                        <li key={d._id} className="bg-gray-800 p-4 rounded flex justify-between items-start">
                            <div>
                                <strong className="text-white">{d.name}<em>({d.type})</em></strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {d.level}
                                </span>
                                <p className="text-sm text-gray-300">{d.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Partners:{' '}
                                    {d.ships
                                        .filter(s => s._id !== id)          // drop the current ship
                                        .map(s => s.name)
                                        .join(', ') || 'None'}
                                </p>
                            </div>
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

            {/* 5) Event Logs */}
            <section>
                <h2 className="text-xl font-semibold">Event Log</h2>
                <ul className="space-y-2">
                    {logs.map(l => (
                        <li key={l._id} className="bg-gray-800 p-2 rounded flex justify-between">
                            <div>
                                <strong className="text-white">{l.eventName}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {l.level}
                                </span>
                                <p className="text-gray-300">{l.effect}</p>
                                <div className="text-sm text-gray-400">
                                    Phase: {l.phase} • Ongoing: {l.ongoing ? 'Yes' : 'No'}
                                </div>
                            </div>
                            <button
                                className="btn-sm bg-red-600 text-white px-2 py-1 rounded"
                                onClick={async e => {
                                    e.preventDefault()
                                    await fetch(`/api/eventlog/${d._id}`, { method: 'DELETE' })
                                    mutate(`/api/eventlog?arcship=${id}`)
                                }}
                            >
                                End
                            </button>
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

        </div>
    )
}
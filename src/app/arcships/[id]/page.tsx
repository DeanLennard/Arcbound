// src/app/arcships/[id]/page.tsx
import React from 'react'
import { redirect, notFound } from 'next/navigation'
import { getServerSession }   from 'next-auth'
import authOptions            from '@/lib/authOptions'
import {dbConnect} from '@/lib/mongodb';
import type { Types } from 'mongoose'
import Character from '@/models/Character'
import '@/models/User';
import '@/models/Module'
import Diplomacy, {DiplomacyType} from '@/models/Diplomacy'
import '@/models/Effect'
import '@/models/EventLog'
import '@/models/Sector'
import Arcship from '@/models/Arcship'
import type { ArcshipDocument }     from '@/models/Arcship'
import type { ModuleDoc as ModuleDocument }      from '@/models/Module'
import type { EffectDoc as EffectDocument }      from '@/models/Effect'
import type { DiplomacyDoc as DiplomacyDocument }   from '@/models/Diplomacy'
import type { EventLogDoc as EventLogDocument }    from '@/models/EventLog'
import ArcshipActions from '@/components/ArcshipActions'
import {prepareHtmlForFrontend} from "@/lib/prepareHtmlForFrontend";

/**  All of ArcshipDocument *plus* the things you populated… */
type PopulatedArcship =
    Omit<ArcshipDocument,
        'modules'|'effects'|'diplomacy'|'eventLog'|'commanders'|'prevCommanders'
    > & {
    modules:        ModuleDocument[];
    effects:        EffectDocument[];
    diplomacy:      DiplomacyDocument[];
    eventLog:       EventLogDocument[];
    commanders:     PopulatedCommander[];
    prevCommanders: PopulatedCommander[];
};

interface ShipSummary {
    _id: string
    name: string
}

type DiplomacyWithShips = Omit<DiplomacyDocument, 'ships'> & {
    ships: ShipSummary[]
}

type PopulatedCommander = {
    _id: Types.ObjectId
    charName: string
    // any other character props you actually render…
    user: {
        _id: Types.ObjectId
        playerName: string
    }
}

export default async function ArcshipPage(
    { params }: { params: Promise<{ id: string }> }
) {
    // first await the incoming params
    const { id } = await params;

    const session = await getServerSession(authOptions)
    if (!session) {
        // not logged in → send to sign-in
        return redirect('/login')
    }

    await dbConnect()

    const [ rawShip, agreements ]: [
            PopulatedArcship | null,
        DiplomacyWithShips[]
    ] = await Promise.all([
            Arcship
                .findById(id)
                .populate('modules')
                .populate('effects')
                .populate({
                    path: 'diplomacy',
                    populate: { path: 'ships', select: 'name' }
                })
                .populate({
                    path: 'commanders',
                    match: { status: 'Active' },
                    populate: { path: 'user', select: '_id playerName' }
                })
                .populate({
                    path: 'prevCommanders',
                    match: { status: { $in: ['Dead','Retired'] } },
                    populate: { path: 'user', select: 'playerName' }
                })
                .populate({ path: 'eventLog', options: { sort: { createdAt: -1 } } })
                .populate<{ currentSector: { name: string; x: number; y: number } }>('currentSector')
                .lean<PopulatedArcship>(),

            Diplomacy
                .find({ ships: id })
                .populate('ships', 'name')
                .lean<DiplomacyWithShips[]>(),
        ])

    if (!rawShip) return notFound()

    const ship = rawShip as PopulatedArcship & {
        currentSector: { name: string; x: number; y: number }
    }

    if (!ship) return <p>Arcship not found</p>

    const eventLog = [...ship.eventLog]
        .sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    const sectorName = ship.currentSector.name
    const { x: sx, y: sy } = ship.currentSector

    // build an array of plain‐old JS objects
    const tradePartners: ShipSummary[] = agreements
        .filter(d => d.type === 'Trade Agreement')
        .flatMap(d =>
            d.ships.map(s => ({
                // String(...) will turn either an ObjectId or a string
                // into a plain JS string
                _id:   String(s._id),
                name:  s.name,
            }))
        )

    // guard
    const isAdmin     = session.user.role === 'admin'
    const isCommander = ship.commanders.some(c =>
        c.user?._id.toString() === session.user.id
    )

    const iOwnThisShip = Boolean(
        await Character.findOne({
            user: session.user.id,
            status: 'Active',
            $or: [
                { arcship: id },
                { AdditionalArcships: id }
            ]
        }).lean()
    )

    if (!(isAdmin || isCommander || iOwnThisShip)) {
        // pretend it’s missing for unauthorized folks
        return notFound()
    }

    // — Core totals
    const hullTotal  = ship.hull.base  + ship.hull.mod
    const coreTotal  = ship.core.base  + ship.core.mod
    const cmdTotal   = ship.cmd.base   + ship.cmd.mod
    const crewTotal  = ship.crew.base  + ship.crew.mod
    const navTotal   = ship.nav.base   + ship.nav.mod
    const senseTotal = ship.sense.base + ship.sense.mod
    const intcTotal  = ship.intc.base  + ship.intc.mod

    // Offensive FP
    const baseOffensiveFP  = coreTotal * 200
    const modOffensiveFP   = ship.offensiveMod ?? 0
    const totalOffensiveFP = baseOffensiveFP + modOffensiveFP

    // Defensive FP
    const baseDefensiveFP  = hullTotal * 400
    const modDefensiveFP   = ship.defensiveMod ?? 0
    const totalDefensiveFP = baseDefensiveFP + modDefensiveFP

    // Tactical AP
    const baseTacticalAP   = cmdTotal
    const modTacticalAP    = ship.tacticalMod ?? 0
    const totalTacticalAP  = baseTacticalAP + modTacticalAP

    const movementByNav = (n: number) => {
        if (n <= 0) return 0
        if (n <= 2) return 1
        if (n <= 4) return 2
        if (n <= 6) return 3
        if (n <= 8) return 4
        return 5
    }

    // Movement
    const baseIntMovement     = movementByNav(navTotal)
    const modIntMovement      = ship.movementInteractionMod ?? 0
    const totalIntMovement    = baseIntMovement + modIntMovement

    const baseResMovement     = movementByNav(navTotal)
    const modResMovement      = ship.movementResolutionMod ?? 0
    const totalResMovement    = baseResMovement + modResMovement

    // 2) Range (in hexes)
    const baseRangeHexes     = (() => {
        if (senseTotal <= 1)  return 0
        if (senseTotal <= 4)  return 1
        if (senseTotal <= 7)  return 2
        if (senseTotal <= 9)  return 3
        return 5
    })()
    const modRangeHexes    = ship.targetRangeMod ?? 0
    const totalRangeHexes  = baseRangeHexes + modRangeHexes
    const totalRangeLabel  = totalRangeHexes === 0
        ? 'Current Hex'
        : `${totalRangeHexes} Hex${totalRangeHexes>1?'es':''} away`

    // 3) Shipping Items
    const baseShipping       = (() => {
        if (senseTotal <= 1)  return 0
        if (senseTotal <= 4)  return 1
        if (senseTotal <= 7)  return 2
        if (senseTotal <= 9)  return 3
        return 5
    })()
    const modShipping      = ship.shippingItemsMod ?? 0
    const totalShipping    = baseShipping + modShipping
    const totalShippingLabel = totalShipping === 0
        ? 'No Trades'
        : `${totalShipping} Item${totalShipping>1?'s':''} / phase`

    // Module Slots
    const baseModuleSlots  = Math.floor(intcTotal * 1.5)
    const modModuleSlots   = ship.moduleSlotsMod ?? 0
    const totalModuleSlots = baseModuleSlots + modModuleSlots

    // — Resources (both Balance & Income use same formula)
    const alloysIncome   = hullTotal  * 3000
    const energyIncome   = coreTotal  * 3000
    const dataIncome     = senseTotal * 3000
    const essenceIncome  = crewTotal  * 1000
    const creditsIncome  = crewTotal  * 1000

    const formatNum = (n: number) =>
        n.toLocaleString('en-GB')

    type CoreKey = 'hull'|'core'|'cmd'|'crew'|'nav'|'sense'|'intc';
    const coreKeys: CoreKey[] = ['hull','core','cmd','crew','nav','sense','intc'];

    const bgByType: Record<DiplomacyType, string> = {
        'Trade Agreement':     'bg-green-600 text-white',
        'Non Aggression Pact': 'bg-blue-600 text-white',
        'Alliance':            'bg-cyan-600 text-white',
        'War':                 'bg-red-600 text-white',
        'Total Annihilation':  'bg-red-900 text-white',
        'Vassal':              'bg-yellow-600 text-black',
    }

    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <header className="mb-4">
                <h1 className="text-4xl font-bold">{ship.name}</h1>
                <p className="text-gray-400">{ship.faction} • Sector: {sectorName} ({sx},{sy})</p>
            </header>

            {/* ACTION BUTTONS: transfer credits & resources */}
            <ArcshipActions
                shipId={id}
                creditsBalance={ship.creditsBalance}
                alloysBalance={ship.alloysBalance}
                energyBalance={ship.energyBalance}
                dataBalance={ship.dataBalance}
                essenceBalance={ship.essenceBalance}
                entropyBalance={ship.entropyBalance}
                causalKeysBalance={ship.causalKeysBalance}
                resonantFractalsBalance={ship.resonantFractalsBalance}
                continuumThreadsBalance={ship.continuumThreadsBalance}
                anchorShardsBalance={ship.anchorShardsBalance}
                recursionTokensBalance={ship.recursionTokensBalance}
                partners={tradePartners}
                navTotal={navTotal}
                intMovement={totalIntMovement}
                currentX={ship.xSector}
                currentY={ship.ySector}
            />

            {/* ——— Benefit & Challenge ——— */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Benefit</h2>
                    <p className="text-gray-200 break-smart">
                        {ship.benefit || <em>None</em>}
                    </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Challenge</h2>
                    <p className="text-gray-200 break-smart">
                        {ship.challenge || <em>None</em>}
                    </p>
                </div>
            </div>

            {/* Core Metrics & Derived Values */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Core Metrics</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white text-gray-900 rounded-lg">
                            <thead className="bg-gray-200">
                            <tr>
                                {['Metric','Total','Base','Mod'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {coreKeys.map(key => {
                                const m = ship[key];
                                const total = m.base + m.mod;
                                return (
                                    <tr
                                        key={key}
                                        className={`border-t ${
                                            total === 0
                                                ? 'bg-red-50 text-red-600'   // red-tint background + red text
                                                : ''
                                        }`}
                                    >
                                        <td className="px-4 py-2">{key.toUpperCase()}</td>
                                        <td className="px-4 py-2">{total}</td>
                                        <td className="px-4 py-2">{m.base}</td>
                                        <td className="px-4 py-2">{m.mod}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2>Derived Values</h2>
                    <table>
                        <thead></thead>
                        <tbody>
                        {[
                            ['',             'Total',            'Base',           'Mod'],
                            ['Offensive FP', totalOffensiveFP,   baseOffensiveFP,  modOffensiveFP],
                            ['Defensive FP', totalDefensiveFP,   baseDefensiveFP,  modDefensiveFP],
                            ['Tactical AP',  totalTacticalAP,    baseTacticalAP,   modTacticalAP],
                            ['Movement Int', totalIntMovement,   baseIntMovement,  modIntMovement],
                            ['Movement Res', totalResMovement,   baseResMovement,  modResMovement],
                            ['Range',        totalRangeLabel,    baseRangeHexes,   modRangeHexes],
                            ['Shipping',     totalShippingLabel, baseShipping,     modShipping],
                            ['Module Slots', totalModuleSlots,   baseModuleSlots,  modModuleSlots],
                        ].map(([label, base, mod, total]) => (
                            <tr key={label}>
                                <td className="px-4 py-2">{label}</td>
                                <td className="px-4 py-2">{base}</td>
                                <td className="px-4 py-2">{mod}</td>
                                <td className="px-4 py-2">{total}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </div>

            {/* Resources */}
            <section>
                <h2 className="text-2xl font-semibold mb-2">Resources</h2>
                <div className="overflow-x-auto">
                    {isAdmin && (
                        <button
                            onClick={async () => {
                                await fetch(`/api/arcships/add-phase-resources`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ shipId: id })
                                });
                                location.reload(); // refresh balances
                            }}
                            className="mb-3 px-3 py-1 bg-indigo-600 text-white rounded"
                        >
                            Add Phase Resources
                        </button>
                    )}
                    <table className="min-w-full bg-white text-gray-900 rounded-lg">
                        <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left">Resource</th>
                            <th className="px-4 py-2 text-left">Balance</th>
                            <th className="px-4 py-2 text-left">Income / Phase</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr className="border-t">
                            <td className="px-4 py-2">Alloys</td>
                            <td className="px-4 py-2">{formatNum(ship.alloysBalance)}</td>
                            <td className="px-4 py-2">{formatNum(alloysIncome)}</td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-4 py-2">Energy</td>
                            <td className="px-4 py-2">{formatNum(ship.energyBalance)}</td>
                            <td className="px-4 py-2">{formatNum(energyIncome)}</td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-4 py-2">Data</td>
                            <td className="px-4 py-2">{formatNum(ship.dataBalance)}</td>
                            <td className="px-4 py-2">{formatNum(dataIncome)}</td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-4 py-2">Essence</td>
                            <td className="px-4 py-2">{formatNum(ship.essenceBalance)}</td>
                            <td className="px-4 py-2">{formatNum(essenceIncome)}</td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-4 py-2">Credits</td>
                            <td className="px-4 py-2">{formatNum(ship.creditsBalance)}</td>
                            <td className="px-4 py-2">{formatNum(creditsIncome)}</td>
                        </tr>

                        {/* NEW CONDITIONAL RESOURCES */}
                        {ship.entropyBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Entropy</td>
                                <td className="px-4 py-2">{formatNum(ship.entropyBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        {ship.causalKeysBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Causal Keys</td>
                                <td className="px-4 py-2">{formatNum(ship.causalKeysBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        {ship.resonantFractalsBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Resonant Fractals</td>
                                <td className="px-4 py-2">{formatNum(ship.resonantFractalsBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        {ship.continuumThreadsBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Continuum Threads</td>
                                <td className="px-4 py-2">{formatNum(ship.continuumThreadsBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        {ship.anchorShardsBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Anchor Shards</td>
                                <td className="px-4 py-2">{formatNum(ship.anchorShardsBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        {ship.recursionTokensBalance > 0 && (
                            <tr className="border-t">
                                <td className="px-4 py-2">Recursion Tokens</td>
                                <td className="px-4 py-2">{formatNum(ship.recursionTokensBalance)}</td>
                                <td className="px-4 py-2">0</td>
                            </tr>
                        )}

                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modules, Effects & Diplomacy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 1) Modules */}
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Modules</h2>
                    <ul className="space-y-2 text-gray-100">
                        {ship.modules.map(mod => (
                            <li key={String(mod._id)}
                                className={`
                                    p-2 rounded
                                    ${mod.state === 'Active'   ? 'bg-green-600 text-white'
                                    : mod.state === 'Inactive' ? 'bg-red-600   text-white'
                                    : 'bg-gray-800 text-gray-100'}
                                `}
                            >
                                <strong>{mod.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {mod.level}
                                </span>
                                <p className="text-sm break-smart">{mod.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 2) Effects */}
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Effects</h2>
                    <ul className="space-y-2">
                        {ship.effects.map(fx => (
                            <li key={String(fx._id)}
                                className={`
                                    p-2 rounded 
                                    ${fx.kind === 'Positive' ? 'bg-green-600 text-white'
                                    : fx.kind === 'Negative'   ? 'bg-red-600   text-white'
                                    : 'bg-gray-600 text-gray-100'}
                                `}
                            >
                                <strong>{fx.name}</strong>
                                <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                    {fx.level}
                                </span>
                                <p className="text-sm break-smart">{fx.description}</p>
                                <div className="mt-1 text-xs">
                                    Status:{' '}
                                    <span>{fx.kind}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 3) Diplomatic Arrangements */}
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Diplomatic Arrangements</h2>
                    <ul className="space-y-2 text-gray-100">
                        {agreements.map(d => {
                            const ships = d.ships as ShipSummary[]
                            const others = ships
                                .filter(s => s._id !== ship._id)
                                .map(s => s.name)
                                .join(', ')

                            return (
                                <li
                                    key={String(d._id)}
                                    className={`
                                        ${bgByType[d.type]}
                                        p-2 rounded
                                    `}
                                >
                                    <strong>{d.name}</strong> ({d.type})
                                    <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded text-white">
                                        {d.level}
                                    </span>
                                    <div className="mt-1 text-sm text-black break-smart">
                                        Partners: {others || 'None'}
                                    </div>
                                    <div
                                        className="mt-1 text-s tiptap break-smart"
                                        dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(d.description) }}
                                    />
                                </li>
                            )
                        })}
                    </ul>
                </section>
            </div>

            {/* Commanders, History, Event Log */}
            <div className="space-y-8">
                {/* Commanders */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Active */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Active Commanders</h2>
                        {ship.commanders.length > 0 ? (
                            <ul className="space-y-2 text-gray-100">
                                {ship.commanders.map(c => (
                                    <li key={String(c._id)} className="p-2 bg-gray-800 rounded">
                                        {c.charName} <span className="text-sm text-gray-400">({c.user?.playerName || 'Unknown'})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">None</p>
                        )}
                    </div>

                    {/* Previous */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Previous Commanders</h2>
                        {ship.prevCommanders.length > 0 ? (
                            <ul className="space-y-2 text-gray-100">
                                {ship.prevCommanders.map(c => (
                                    <li key={String(c._id)} className="p-2 bg-gray-800 rounded">
                                        {c.charName} <span className="text-sm text-gray-400">({c.user?.playerName || 'Unknown'})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">None</p>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">History</h2>
                    <div
                        className="text-gray-100 prose max-w-none tiptap break-smart"
                        dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(ship.history) }}
                    />
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Event Log</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white text-gray-900 rounded-lg">
                            <thead className="bg-gray-200">
                            <tr>
                                {['Event','Effect','Phase','Power','Ongoing'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {eventLog.map(e => (
                                <tr key={String(e._id)} className="border-t">
                                    <td className="px-4 py-2">{e.eventName}</td>
                                    <td className="px-4 py-2 break-smart">{e.effect}</td>
                                    <td className="px-4 py-2">{e.phase}</td>
                                    <td className="px-4 py-2">{e.level}</td>
                                    <td className="px-4 py-2">{e.ongoing ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    )
}
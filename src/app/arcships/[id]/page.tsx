// src/app/arcships/[id]/page.tsx
import React from 'react'
import {dbConnect} from '@/lib/mongodb';
import '@/models/Character';
import '@/models/User';
import '@/models/Module'
import Diplomacy from '@/models/Diplomacy'
import '@/models/Effect'
import '@/models/EventLog'
import Arcship from '@/models/Arcship'

interface Props { params: { id: string } }

export default async function ArcshipPage({ params: { id } }: Props) {
    await dbConnect()
    const [ ship, agreements ] = await Promise.all([
        Arcship.findById(id)
            .populate('modules')                   // your Module docs
            .populate('effects')             // your Effect docs
            .populate({
                path: 'commanders',
                match: { status: 'Active' },
                populate: {
                    path: 'user',
                    select: 'playerName'
                }
            })
            // only dead or retired in `prevCommanders`
            .populate({
                path: 'prevCommanders',
                match: { status: { $in: ['Dead','Retired'] } },
                populate: {
                    path: 'user',
                    select: 'playerName'
                }
            })
            .populate({
                path: 'eventLog',
                options: { sort: { createdAt: -1 } }
            })
            .lean(),
        // ← load all diplomacy docs that include this ship
        Diplomacy.find({ ships: id })
            .populate('ships', 'name')
            .lean(),
    ])

    if (!ship) return <p>Arcship not found</p>

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

    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <header className="mb-4">
                <h1 className="text-4xl font-bold">{ship.name}</h1>
                <p className="text-gray-400">{ship.faction} • Sector: {ship.currentSector}</p>
            </header>

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
                            {(['hull','core','cmd','crew','nav','sense','intc'] as const).map(key => {
                                const m     = (ship as any)[key];
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
                        {ship.modules.map((mod: any) => (
                            <li key={mod._id}
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
                                <p className="text-sm">{mod.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 2) Effects */}
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Effects</h2>
                    <ul className="space-y-2">
                        {ship.effects.map((fx: any) => (
                            <li key={fx._id}
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
                                <p className="text-sm">{fx.description}</p>
                                <div className="mt-1 text-xs">
                                    Status:{' '}
                                    <span
                                        className={
                                            fx.kind === 'Positive'
                                                ? 'text-green-400'
                                                : fx.kind === 'Negative'
                                                    ? 'text-red-400'
                                                    : 'text-gray-400'
                                        }
                                    >
                                      {fx.kind}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 3) Diplomatic Arrangements */}
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Diplomatic Arrangements</h2>
                    <ul className="space-y-2 text-gray-100">
                        {agreements.map((d: any) => {
                            const others = d.ships
                                .filter((s: any) => s._id !== ship._id)
                                .map((s: any) => s.name)
                                .join(', ')

                            return (
                                <li key={d._id} className="bg-gray-800 p-2 rounded">
                                    <strong>{d.name}</strong> ({d.type})
                                    <span className="ml-2 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                        {d.level}
                                    </span>
                                    <div className="mt-1 text-sm text-gray-400">
                                        Partners: {others || 'None'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">{d.description}</div>
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
                                {ship.commanders.map((c: any) => (
                                    <li key={c._id} className="p-2 bg-gray-800 rounded">
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
                                {ship.prevCommanders.map((c: any) => (
                                    <li key={c._id} className="p-2 bg-gray-800 rounded">
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
                    <p className="text-gray-100">{ship.history}</p>
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
                            {ship.eventLog.map((e: any) => (
                                <tr key={e._id} className="border-t">
                                    <td className="px-4 py-2">{e.eventName}</td>
                                    <td className="px-4 py-2">{e.effect}</td>
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
// src/app/arcships/[id]/page.tsx
import React from 'react'
import {dbConnect} from '@/lib/mongodb';
import '@/models/Module'
import '@/models/Diplomacy'
import '@/models/Effect'
import '@/models/EventLog'
import Arcship from '@/models/Arcship'

interface Props { params: { id: string } }

export default async function ArcshipPage({ params: { id } }: Props) {
    await dbConnect()
    const ship = await Arcship.findById(id)
        .populate('modules')
        .populate({ path: 'diplomacy', populate: { path: 'targetShip' } })
        .populate('activeEffects')
        .populate('commanders')
        .populate('prevCommanders')
        .populate('eventLog')
        .lean()

    if (!ship) return <p>Arcship not found</p>

    // — Core totals
    const hullTotal  = ship.hull.base  + ship.hull.mod
    const coreTotal  = ship.core.base  + ship.core.mod
    const cmdTotal   = ship.cmd.base   + ship.cmd.mod
    const crewTotal  = ship.crew.base  + ship.crew.mod
    const navTotal   = ship.nav.base   + ship.nav.mod
    const senseTotal = ship.sense.base + ship.sense.mod
    const intcTotal  = ship.intc.base  + ship.intc.mod

    // — Derived values
    const offensiveFP = coreTotal * 200 + ship.core.mod
    const defensiveFP = hullTotal * 400 + ship.hull.mod
    const tacticalAP  = hullTotal       + ship.hull.mod

    const movementByNav = (n: number) => {
        if (n <= 0) return 0
        if (n <= 2) return 1
        if (n <= 4) return 2
        if (n <= 6) return 3
        if (n <= 8) return 4
        return 5
    }
    const movementInteraction = movementByNav(navTotal) + ship.nav.mod
    const movementResolution  = movementByNav(navTotal) + ship.nav.mod

    const targetRangeBySense = (s: number) => {
        if (s <= 1)  return 'Current Hex'
        if (s <= 4)  return '1 Hex away'
        if (s <= 7)  return '2 Hexes away'
        if (s <= 9)  return '3 Hexes away'
        return '5 Hexes away'
    }
    const targetRange   = targetRangeBySense(senseTotal)
    const shippingItems = (() => {
        if (senseTotal <= 1)  return 'No Trades'
        if (senseTotal <= 4)  return '1 Item per phase'
        if (senseTotal <= 7)  return '2 Items per phase'
        if (senseTotal <= 9)  return '3 Items per phase'
        return '5 Items per phase'
    })()

    const moduleSlots = Math.floor(intcTotal * 1.5) + ship.intc.mod

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
                                {['Metric','Base','Mod','Total'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {(['hull','core','cmd','crew','nav','sense','intc'] as const).map(key => {
                                const m = (ship as any)[key]
                                return (
                                    <tr key={key} className="border-t">
                                        <td className="px-4 py-2">{key.toUpperCase()}</td>
                                        <td className="px-4 py-2">{m.base}</td>
                                        <td className="px-4 py-2">{m.mod}</td>
                                        <td className="px-4 py-2">{m.base + m.mod}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Derived Values</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-100">
                        <li>Offensive FP: {offensiveFP}</li>
                        <li>Defensive FP: {defensiveFP}</li>
                        <li>Tactical AP: {tacticalAP}</li>
                        <li>Movement Interaction: {movementInteraction} hexes/step</li>
                        <li>Movement Resolution: {movementResolution} hexes/step</li>
                        <li>Target Range: {targetRange}</li>
                        <li>Shipping Items: {shippingItems}</li>
                        <li>Module Slots: {moduleSlots}</li>
                    </ul>
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

            {/* Modules & Diplomacy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Modules</h2>
                    <ul className="space-y-2 text-gray-100">
                        {ship.modules.map((mod: any) => (
                            <li key={mod._id} className="border p-2 rounded bg-gray-800">
                                <strong>{mod.name}</strong>
                                <p className="text-sm">{mod.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Diplomatic Arrangements</h2>
                    <ul className="space-y-2 text-gray-100">
                        {ship.diplomacy.map((d: any) => (
                            <li key={d._id}>
                                With <strong>{d.targetShip.name}</strong>: {d.type}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* Effects, Commanders, History, Event Log */}
            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-2">Active Effects</h2>
                    <div className="flex flex-wrap gap-2">
                        {ship.activeEffects.map((fx: any) => (
                            <span
                                key={fx._id}
                                className={`px-2 py-1 rounded ${
                                    fx.kind === 'Positive'
                                        ? 'bg-green-200 text-green-800'
                                        : fx.kind === 'Negative'
                                            ? 'bg-red-200 text-red-800'
                                            : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                {fx.name}
              </span>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-2">Commanders</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-100">
                        {ship.commanders.map((c: any) => (
                            <li key={c._id} className="p-2 bg-gray-800 rounded">
                                {c.charName} ({c.playerName})
                            </li>
                        ))}
                    </ul>
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
                                    <td className="px-4 py-2">{e.powerLevel}</td>
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
// src/app/characters/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getServerSession }     from 'next-auth'
import authOptions from '@/lib/authOptions'
import mongoose, { Types } from 'mongoose'
import { dbConnect } from '@/lib/mongodb'
import Character    from '@/models/Character'
import Phase        from '@/models/Phase'
import CharacterAsset, { AssetCategory } from '@/models/CharacterAsset'
import type { CharacterDocument } from '@/models/Character'
import type { ArcshipDocument } from '@/models/Arcship'
import '@/models/User'
import '@/models/Arcship'
import CharacterActions from "@/components/CharacterActions";
import {prepareHtmlForFrontend} from "@/lib/prepareHtmlForFrontend";
import React from "react";
import PhaseHistoryClient from '@/components/PhaseHistoryClient'
import type { Phase as PhaseClientType } from '@/components/PhaseHistory'
import ScrapcodeList, {Scrapcode} from '@/components/ScrapcodeList'

type PopulatedCharacter = Omit<CharacterDocument,'arcship'|'user'> & {
    arcship?: ArcshipDocument | Types.ObjectId | null
    user?: {
        _id: Types.ObjectId
        playerName: string
    } | null
}

type ArcshipLean = {
    _id: Types.ObjectId | string
    name?: string
}

function isPopulatedArcship(x: unknown): x is ArcshipLean {
    return typeof x === 'object' && x !== null && 'name' in x
}

export default async function CharacterPage({
                                                params,
                                            }: {
    params: Promise<{ id: string }>
}) {
    // now `params` is a promise, so we await it
    const { id } = await params;

    const session = await getServerSession(authOptions)
    if (!session) {
        // not logged in → kick to sign-in
        return redirect('/login')
    }

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(id)) notFound()

    // fetch the character (just core fields & arcship)
    const char = await Character.findById(id)
        .populate('arcship')
        .populate({ path: 'user', select: 'playerName' })
        .lean<PopulatedCharacter>()
    if (!char) notFound()

    // guard: only the assigned user or an admin can proceed
    const ownerId = char.user?._id?.toString()
    const isOwner = ownerId === session.user.id
    const isAdmin = session.user.role === 'admin'
    if (!(isOwner || isAdmin)) {
        // pretend it doesn’t exist
        return notFound()
    }

    // 1) Fetch raw phases with lean, typing only the fields we expect at runtime:
    type RawPhase = {
        _id: mongoose.Types.ObjectId
        number: number
        interaction: string
        gambit: string
        resolution: string
    }

    const rawPhases = await Phase.find({ character: id })
        .sort({ number: 1 })
        .lean<RawPhase[]>()

    // 2) Map to pure JSONable PhaseClientType objects:
    const phases: PhaseClientType[] = rawPhases.map(p => ({
        _id:         p._id.toString(),
        number:      p.number,
        interaction: p.interaction,
        gambit:      p.gambit,
        resolution:  p.resolution
    }))

    // fetch all assets and bucket them by category
    const allAssets = await CharacterAsset.find({ character: id }).lean()
    const bucket = (category: AssetCategory) =>
        allAssets.filter(a => a.category === category)

    const tags         = bucket('Tag')
    const items         = bucket('Item')
    const shards        = bucket('Shard')
    const resistances   = bucket('Resistance')
    const weaknesses    = bucket('Weakness')
    const threatLedger  = bucket('ThreatLedger')
    const otherEffects  = bucket('OtherEffect')

    const implants      = bucket('Implant')
    const thresholdforms= bucket('ThresholdForm')
    const genomethreads = bucket('GenomeThread')
    const vitalsignatures= bucket('VitalSignature')
    const rituals       = bucket('Ritual')
    const scrapcodeRaw      = bucket('Scrapcode')
    const scrapcode: Scrapcode[] = scrapcodeRaw.map(r => ({
        _id:          String(r._id),
        name:         r.name,
        description:  r.description,
        level:        r.level,
        state:        r.state,
        buildType:    r.buildType,
        buildCredits: r.buildCredits,
        buildAlloys:  r.buildAlloys,
        buildEnergy:  r.buildEnergy,
        buildData:    r.buildData,
        buildEssence: r.buildEssence,
    }))

    const arcshipName = (() => {
        const a = char.arcship
        if (!a) return 'None'

        // if it looks like a populated arcship document, prefer its name
        if (isPopulatedArcship(a) && typeof a.name === 'string') return a.name

        // otherwise treat it as an [id] (ObjectId or string)
        return String(a)
    })()

    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <header className="bg-gray-800 p-6 rounded-lg">
                <h1 className="text-4xl font-bold text-white">{char.charName} ({char.role})</h1>
                <p className="text-gray-400 mt-2">
                    Player: <span className="text-white">{char.user?.playerName ?? 'Unknown'}</span> •{' '}
                    Arcship:{' '}
                    <span className="italic">
                    {isPopulatedArcship(char.arcship) && typeof char.arcship._id !== 'undefined' ? (
                        <a
                            href={`/arcships/${String(char.arcship._id)}`}
                            className="italic underline"
                        >
                            {char.arcship.name ?? String(char.arcship._id)}
                        </a>
                    ) : (
                        <span className="italic">{arcshipName}</span>
                    )}
                    </span> •{' '}
                    Status: <span className="italic">{char.status}</span> •{' '}
                    Faction: <span className="text-indigo-300">{char.faction}</span> •{' '}
                    Race: <span className="text-green-300">{char.race}</span>
                </p>
            </header>

            {(char?.status === 'Active' || session?.user?.role === 'admin') && (
                <CharacterActions
                    characterId={id}
                    credits={char.credits}
                />
            )}

            {/* Resources & Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Ascension Points</h2>
                    <p className="text-gray-200">
                        Remaining: <strong>{char.ascPoints.remaining - char.ascPoints.spent}</strong><br/>
                        Spent: <strong>{char.ascPoints.spent}</strong><br/>
                        Total: <strong>{char.ascPoints.remaining}</strong>
                    </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Essence Burn</h2>
                    <p className="text-gray-200">
                        Spent: <strong>{char.essenceBurn.spent}</strong><br/>
                        Total: <strong>{char.essenceBurn.remaining}</strong>
                    </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Credits & Legacy Threads</h2>
                    <p className="text-gray-200">Credits: {char.credits.toLocaleString()}</p>
                    {typeof char.legacythreads === 'number' && (
                        <p className="text-gray-200">
                            Legacy Threads: {char.legacythreads.toLocaleString()}
                        </p>
                    )}
                </div>
            </section>

            {/* Background & Objective */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-2">Background</h2>
                    <div
                        className="prose max-w-none tiptap break-smart"
                        dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(char.background) }}
                    />
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-2">Faction Objective</h2>
                    <div
                        className="prose max-w-none tiptap break-smart"
                        dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(char.factionObjective) }}
                    />
                </div>
            </section>

            {/* Relations */}
            {[
                { data: tags,         label: 'Tags'        },
                { data: items,        label: 'Items'        },
                { data: shards,       label: 'Shards'       },
                { data: resistances,  label: 'Resistances'  },
                { data: weaknesses,   label: 'Weaknesses'   },
                { data: otherEffects, label: 'Other Effects'},
            ].map(({ data, label }) => (
                <section key={label}>
                    <h2 className="text-2xl font-semibold mb-2 text-white">{label}</h2>
                    {data.length > 0 ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.map((rel) => (
                                <li key={String(rel._id)} className="bg-gray-800 p-4 rounded-lg">
                                    <strong className="block text-indigo-300 text-lg mb-2">{rel.name}</strong>{' '}
                                    <span className="inline-block ml-0 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                        {rel.level}
                                    </span>
                                    {/* Combined Charges Badge */}
                                    {typeof rel.charges === 'number' && rel.charges > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-purple-600 text-white rounded">
                                            {rel.charges} charge{rel.charges !== 1 ? 's' : ''}
                                            {rel.chargeInterval && rel.chargeInterval !== 'NONE' && (
                                                <>
                                                    {' '}per{' '}
                                                    {rel.chargeInterval === 'PHASE'
                                                        ? 'phase'
                                                        : rel.chargeInterval === 'GAME'
                                                            ? 'game'
                                                            : ''}
                                                </>
                                            )}
                                        </span>
                                    )}
                                    <span
                                        className={`
                                            inline-block ml-2
                                            text-xs px-1 py-0.5 rounded
                                            ${rel.state === 'Active'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-red-600 text-white'
                                        }
                                        `}
                                    >
                                        {rel.state}
                                    </span>
                                    {typeof rel.apcost === 'number' && rel.apcost > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-gray-500 text-white rounded">
                                            {rel.apcost} AP
                                        </span>
                                    )}

                                    {typeof rel.ebcost === 'number' && rel.ebcost > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-gray-500 text-white rounded">
                                            {rel.ebcost} EB
                                        </span>
                                    )}
                                    <p className="text-gray-200 mt-1">{rel.description}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400"><em>None.</em></p>
                    )}
                </section>
            ))}

            {[
                { data: threatLedger,     label: 'Threat Ledger',    color: 'red-300'},
                { data: implants,         label: 'Implants',        color: 'green-300' },
                { data: thresholdforms,   label: 'Threshold Forms',  color: 'blue-300'  },
                { data: genomethreads,    label: 'Genome Threads',   color: 'teal-300'  },
                { data: vitalsignatures,  label: 'Vital Signatures',  color: 'pink-300'  },
                { data: rituals,          label: 'Codified Rituals',  color: 'purple-300'},
            ].map(({ data, label, color }) =>
                data.length > 0 ? (
                    <section key={label}>
                        <h2 className={`text-2xl font-semibold mb-2 text-${color}`}>{label}</h2>
                        <ul className="space-y-2">
                            {data.map(rel => (
                                <li key={String(rel._id)} className="bg-gray-800 p-4 rounded-lg">
                                    <strong className="block text-indigo-300 text-lg mb-2">{rel.name}</strong>{' '}
                                    <span className="inline-block ml-0 text-xs px-1 py-0.5 bg-indigo-600 rounded">
                                        {rel.level}
                                    </span>
                                    {/* Combined Charges Badge */}
                                    {typeof rel.charges === 'number' && rel.charges > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-purple-600 text-white rounded">
                                            {rel.charges} charge{rel.charges !== 1 ? 's' : ''}
                                            {rel.chargeInterval && rel.chargeInterval !== 'NONE' && (
                                                <>
                                                    {' '}per{' '}
                                                    {rel.chargeInterval === 'PHASE'
                                                        ? 'phase'
                                                        : rel.chargeInterval === 'GAME'
                                                            ? 'game'
                                                            : ''}
                                                </>
                                            )}
                                        </span>
                                    )}
                                    <span
                                        className={`
                                        inline-block ml-2
                                        text-xs px-1 py-0.5 rounded
                                        ${rel.state === 'Active'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-red-600 text-white'
                                        }
                                    `}
                                    >
                                    {rel.state}
                                    </span>
                                    {typeof rel.apcost === 'number' && rel.apcost > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-gray-500 text-white rounded">
                                        {rel.apcost} AP
                                    </span>
                                    )}

                                    {typeof rel.ebcost === 'number' && rel.ebcost > 0 && (
                                        <span className="inline-block ml-2 text-xs px-1 py-0.5 bg-gray-500 text-white rounded">
                                        {rel.ebcost} EB
                                    </span>
                                    )}
                                    <div className="text-gray-200 mt-1">{rel.description}</div>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null
            )}

            {char.role === 'Void Mechanic' && (
                <ScrapcodeList
                    scrapcode={scrapcode}
                    characterId={id}
                    characterStatus={char.status}
                    isAdmin={isAdmin}
                />
            )}

            {/* Phase History */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">
                    Phase History
                </h2>
                <div className="space-y-4">
                    {/* now this is a Client Component */}
                    <PhaseHistoryClient phases={phases} />
                </div>
            </section>
        </div>
    )
}

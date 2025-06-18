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

type PopulatedCharacter = Omit<CharacterDocument,'arcship'|'user'> & {
    arcship?: ArcshipDocument
    user?: {
        _id: Types.ObjectId
        playerName: string
    } | null
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

    // fetch phase history
    const phases = await Phase.find({ character: id })
        .sort({ number: 1 })
        .lean()

    // fetch all assets and bucket them by category
    const allAssets = await CharacterAsset.find({ character: id }).lean()
    const bucket = (category: AssetCategory) =>
        allAssets.filter(a => a.category === category)

    const items         = bucket('Item')
    const shards        = bucket('Shard')
    const resistances   = bucket('Resistance')
    const weaknesses    = bucket('Weakness')
    const otherEffects  = bucket('OtherEffect')

    const implants      = bucket('Implant')
    const thresholdforms= bucket('ThresholdForm')
    const genomethreads = bucket('GenomeThread')
    const vitalsignatures= bucket('VitalSignature')
    const rituals       = bucket('Ritual')
    const scrapcode     = bucket('Scrapcode')

    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <header className="bg-gray-800 p-6 rounded-lg">
                <h1 className="text-4xl font-bold text-white">{char.charName} ({char.role})</h1>
                <p className="text-gray-400 mt-2">
                    Player: <span className="text-white">{char.user?.playerName ?? 'Unknown'}</span> •{' '}
                    Status: <span className="italic">{char.status}</span> •{' '}
                    Faction: <span className="text-indigo-300">{char.faction}</span> •{' '}
                    Archetype: <span className="text-green-300">{char.race}</span>
                </p>
            </header>

            <CharacterActions
                characterId={id}
                credits={char.credits}
            />

            {/* Resources & Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Ascension Points</h2>
                    <p className="text-gray-200">
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
                    <h2 className="text-xl font-semibold text-white mb-2">Credits</h2>
                    <p className="text-gray-200">{char.credits.toLocaleString()}</p>
                </div>
            </section>

            {/* Background & Objective */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-2">Background</h2>
                    <p className="text-gray-200 tiptap">{char.background || <em>None</em>}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-2">Faction Objective</h2>
                    <p className="text-gray-200 tiptap">{char.factionObjective || <em>None</em>}</p>
                </div>
            </section>

            {/* Relations */}
            {[
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
                { data: implants,         label: 'Implants',        color: 'green-300' },
                { data: thresholdforms,   label: 'Threshold Forms',  color: 'blue-300'  },
                { data: genomethreads,    label: 'Genome Threads',   color: 'teal-300'  },
                { data: vitalsignatures,  label: 'Vital Signatures',  color: 'pink-300'  },
                { data: rituals,          label: 'Codified Rituals',  color: 'purple-300'},
                { data: scrapcode,        label: 'Scrapcode Compendium', color: 'yellow-300' },
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
                    </section>
                ) : null
            )}

            {/* Phase History */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Phase History</h2>
                {phases.length ? (
                    <div className="space-y-4">
                        {phases.map((ph) => (
                            <div
                                key={String(ph._id)}
                                className="bg-gray-800 p-4 rounded-lg space-y-4"
                            >
                                {/* Phase header */}
                                <h4 className="text-indigo-300 font-semibold">
                                    Phase {ph.number}
                                </h4>

                                {/* Interaction */}
                                <div>
                                    <p className="font-semibold text-gray-200 mb-1">Interaction:</p>
                                    <div
                                        className="prose prose-sm prose-white max-w-none tiptap"
                                        dangerouslySetInnerHTML={{ __html: ph.interaction }}
                                    />
                                </div>

                                {/* Gambit */}
                                <div>
                                    <p className="font-semibold text-gray-200 mb-1">Gambit:</p>
                                    <div
                                        className="prose prose-sm prose-white max-w-none tiptap"
                                        dangerouslySetInnerHTML={{ __html: ph.gambit }}
                                    />
                                </div>

                                {/* Resolution */}
                                <div>
                                    <p className="font-semibold text-gray-200 mb-1">Resolution:</p>
                                    <div
                                        className="prose prose-sm prose-white max-w-none tiptap"
                                        dangerouslySetInnerHTML={{ __html: ph.resolution }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400"><em>No phase history yet.</em></p>
                )}
            </section>
        </div>
    )
}

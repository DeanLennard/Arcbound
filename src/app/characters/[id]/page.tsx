import { notFound } from 'next/navigation'
import Character from '@/models/Character'
import {dbConnect} from '@/lib/mongodb';
import mongoose from 'mongoose'

interface PageProps {
    params: { id: string }
}

export default async function CharacterPage({ params }: PageProps) {
    await dbConnect()

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) notFound()

    const char = await Character.findById(params.id)
        .populate([
            'arcship',
            'items',
            'shards',
            'resistances',
            'weaknesses',
            'otherEffects',
            'implants',
            'rituals',
            'compendium',
            'phases',
        ])
        .lean()

    if (!char) notFound()

    return (
        <div className="prose p-6">
            <h1>{char.charName}</h1>
            <p>
                <strong>Player:</strong> {char.playerName} &nbsp;|&nbsp;
                <strong>Status:</strong> {char.status} &nbsp;|&nbsp;
                <strong>Faction:</strong> {char.faction} &nbsp;|&nbsp;
                <strong>Archetype:</strong> {char.archetype}
            </p>

            <section>
                <h2>Resources & Stats</h2>
                <ul>
                    <li>Ascension Points: {char.ascPoints.spent} spent, {char.ascPoints.remaining} remaining</li>
                    <li>Essence Burn: {char.essenceBurn.spent} spent, {char.essenceBurn.remaining} remaining</li>
                    <li>Credits: {char.credits}</li>
                </ul>
            </section>

            <section>
                <h2>Background</h2>
                <p>{char.background}</p>
            </section>

            <section>
                <h2>Faction Objective</h2>
                <p>{char.factionObjective}</p>
            </section>

            {/* Relations: items, shards, etc. */}
            {['items','shards','resistances','weaknesses','otherEffects'].map((rel: any) => (
                <section key={rel}>
                    <h3>{rel.charAt(0).toUpperCase() + rel.slice(1)}</h3>
                    {char[rel].length > 0 ? (
                        <ul>
                            {char[rel].map((it: any) => (
                                <li key={it._id}>
                                    <strong>{it.name}</strong> (PL {it.power}) – {it.desc || it.description}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p><em>None.</em></p>
                    )}
                </section>
            ))}

            <section>
                <h2>Role-Specific</h2>
                {char.implants?.length > 0 && (
                    <>
                        <h3>Implants</h3>
                        <ul>
                            {char.implants.map((imp: any) => (
                                <li key={imp._id}>{imp.name} (PL {imp.power}) – {imp.description}</li>
                            ))}
                        </ul>
                    </>
                )}
                {char.rituals?.length > 0 && (
                    <>
                        <h3>Codified Rituals</h3>
                        <ul>
                            {char.rituals.map((rit: any) => (
                                <li key={rit._id}>{rit.name} (PL {rit.power}) – {rit.description}</li>
                            ))}
                        </ul>
                    </>
                )}
                {char.compendium?.length > 0 && (
                    <>
                        <h3>Scrapcode Compendium</h3>
                        <ul>
                            {char.compendium.map((scr: any) => (
                                <li key={scr._id}>{scr.name} (PL {scr.power}) – {scr.description}</li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <section>
                <h2>Phase History</h2>
                {char.phases.length > 0 ? (
                    char.phases.map((ph: any) => (
                        <div key={ph._id} className="mb-4">
                            <h4>Phase {ph.number}</h4>
                            <p><strong>Interaction:</strong> {ph.interaction}</p>
                            <p><strong>Gambit:</strong> {ph.gambit}</p>
                            <p><strong>Resolution:</strong> {ph.resolution}</p>
                        </div>
                    ))
                ) : (
                    <p><em>No phase history yet.</em></p>
                )}
            </section>
        </div>
    )
}

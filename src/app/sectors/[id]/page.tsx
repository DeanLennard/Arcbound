// src/app/sectors/[id]/page.tsx
import { dbConnect } from '@/lib/mongodb';
import Sector from '@/models/Sector';
import '@/models/Effect';
import type { EffectDoc } from '@/models/Effect';

type SectorWithEffects = {
    _id: string;
    name: string;
    x: number;
    y: number;
    control: string;
    hasMission: boolean;
    effects: EffectDoc[];
};

export default async function SectorPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await dbConnect();

    const sector = await Sector.findById(id)
        .populate('effects')
        .lean<SectorWithEffects>();

    if (!sector) return <p>Sector not found</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-4xl font-bold">{sector.name}</h1>

            <p className="text-gray-300">
                Coordinates: ({sector.x}, {sector.y}) • Control: {sector.control}
            </p>

            {sector.hasMission && (
                <div className="p-3 bg-indigo-700 text-white rounded">
                    This sector contains a mission.
                </div>
            )}

            <section>
                <h2 className="text-2xl font-semibold mb-2">Effects</h2>
                <ul className="space-y-2">
                    {sector.effects?.map(e => (
                        <li
                            key={String(e._id)}
                            className={`p-2 rounded ${
                                e.kind === 'Positive'
                                    ? 'bg-green-600'
                                    : e.kind === 'Negative'
                                        ? 'bg-red-600'
                                        : 'bg-gray-700'
                            } text-white`}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-lg">{e.name}</strong>

                                {/* Power Level Badge */}
                                <span className="text-xs px-2 py-1 rounded bg-indigo-600">
                                    {e.level}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-300 text-sm">{e.description}</p>
                        </li>
                    ))}
                </ul>

            </section>
        </div>
    );
}

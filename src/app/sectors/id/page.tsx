// src/app/sectors/[id]/page.tsx
import { dbConnect } from '@/lib/mongodb';
import Sector from '@/models/Sector';
import '@/models/Effect';

export default async function SectorPage({ params }: { params: { id: string } }) {
    await dbConnect();

    const sector = await Sector.findById(params.id)
        .populate('effects')
        .lean();

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
                    {sector.effects.map((e: any) => (
                        <li key={e._id}
                            className={`p-2 rounded ${
                                e.kind === 'Positive' ? 'bg-green-600'
                                    : e.kind === 'Negative' ? 'bg-red-600'
                                        : 'bg-gray-700'
                            } text-white`}
                        >
                            <strong>{e.name}</strong> (Lv {e.level})
                            <p className="text-sm">{e.description}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

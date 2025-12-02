// src/app/(dashboard)/admin/sectors/AddSectorEffectModal.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';

interface FormValues {
    name: string;
    description: string;
    kind: 'Positive' | 'Neutral' | 'Negative';
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE';
}

export default function AddSectorEffectModal({
                                                 sectorId,
                                                 onCreated,
                                                 onClose,
                                             }: {
    sectorId: string;
    onCreated: (effectId: string) => void;
    onClose: () => void;
}) {
    const { register, handleSubmit, formState: { isSubmitting } } =
        useForm<FormValues>();

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        // 1. Create effect
        const res = await fetch('/api/sector-effects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: vals.name,
                description: vals.description,
                kind: vals.kind,
                level: vals.level
            }),
        });

        const newEffect = await res.json();

        // 2. Attach effect to sector
        await fetch(`/api/sectors/${sectorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addEffect: newEffect._id }),
        });

        // 3. Notify parent
        onCreated(newEffect._id);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 w-full max-w-md"
            >
                <h3 className="text-xl text-white">Add New Effect</h3>

                <div>
                    <label className="text-gray-300">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                </div>

                <div>
                    <label className="text-gray-300">Description</label>
                    <textarea
                        {...register('description', { required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="text-gray-300">Level</label>
                    <select
                        {...register('level', { required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">Select Level</option>
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
                </div>

                <div>
                    <label className="text-gray-300">Kind</label>
                    <select
                        {...register('kind', { required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">Select Kind</option>
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 bg-gray-600 text-white rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                        Add
                    </button>
                </div>
            </form>
        </div>
    );
}

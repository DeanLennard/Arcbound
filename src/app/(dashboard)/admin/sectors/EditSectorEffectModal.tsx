// src/app/(dashboard)/admin/sectors/EditSectorEffectModal.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import type { EffectDoc } from '@/models/Effect';

interface Props {
    effect: EffectDoc;
    onSaved: () => void;
    onClose: () => void;
}

interface FormValues {
    name: string;
    description: string;
    level: string;
    kind: string;
}

export default function EditSectorEffectModal({ effect, onSaved, onClose }: Props) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            name: effect.name,
            description: effect.description,
            level: effect.level,
            kind: effect.kind
        }
    });

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        await fetch(`/api/sector-effects/${effect._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vals),
        });

        onSaved();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 w-full max-w-md"
            >
                <h3 className="text-xl text-white">Edit Effect</h3>

                <div>
                    <label className="text-gray-300">Name</label>
                    <input {...register('name', { required: true })} className="w-full p-2 bg-gray-700 text-white rounded" />
                </div>

                <div>
                    <label className="text-gray-300">Description</label>
                    <textarea {...register('description', { required: true })} className="w-full p-2 bg-gray-700 text-white rounded" rows={3} />
                </div>

                <div>
                    <label className="text-gray-300">Level</label>
                    <select {...register('level', { required: true })} className="w-full p-2 bg-gray-700 text-white rounded">
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
                </div>

                <div>
                    <label className="text-gray-300">Kind</label>
                    <select {...register('kind', { required: true })} className="w-full p-2 bg-gray-700 text-white rounded">
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-600 text-white rounded">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-3 py-1 bg-indigo-600 text-white rounded">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

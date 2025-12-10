// src/app/(dashboard)/admin/arcships/[id]/AddModuleModal.tsx
'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { mutate }                 from 'swr';

interface FormValues {
    name:        string;
    description: string;
    state:       'Active' | 'Inactive';
    level:       'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
    charges?: number;
    maxCharges?: number;
    chargeInterval: 'NONE' | 'PHASE' | 'GAME';
}

export default function AddModuleModal({
                                           arcshipId,
                                           onClose
                                       }: {
    arcshipId: string;
    onClose(): void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } }
        = useForm<FormValues>({
        defaultValues: {
            name: '',
            description: '',
            state: 'Active',
            level: 'SPARK',
            charges: 0,
            maxCharges: 0,
            chargeInterval: 'NONE',
        }
    });

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        const payload = {
            ...vals,
            attachedTo: arcshipId
        };

        const res = await fetch('/api/modules', {
            method:  'POST',
            headers: { 'Content-Type':'application/json' },
            body:    JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Could not create module');
        // refresh the list of attached modules:
        mutate(`/api/modules?attachedTo=${arcshipId}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 max-w-lg w-full"
            >
                <h3 className="text-lg font-semibold text-white">New Module</h3>

                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input
                        {...register('name',{ required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Description</label>
                    <textarea
                        {...register('description',{ required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        rows={3}
                    />
                    {errors.description && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Power Level</label>
                    <select
                        {...register('level')}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-300">State</label>
                    <select
                        {...register('state')}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Max Charges</label>
                    <input
                        type="number"
                        {...register("maxCharges")}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Starting Charges</label>
                    <input
                        type="number"
                        {...register("charges")}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Charge Interval</label>
                    <select
                        {...register("chargeInterval")}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="NONE">None</option>
                        <option value="PHASE">Per Phase</option>
                        <option value="GAME">Per Game</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn"
                    >
                        Create & Attach
                    </button>
                </div>
            </form>
        </div>
    );
}

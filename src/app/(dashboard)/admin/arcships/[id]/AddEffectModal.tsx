// src/app/(dashboard)/admin/arcships/[id]/AddEffectModal.tsx
'use client'
import { useForm, SubmitHandler } from 'react-hook-form'
import { mutate } from 'swr'

interface FormValues {
    name: string
    description: string
    kind: 'Positive' | 'Neutral' | 'Negative'
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
    charges?: number;
    maxCharges?: number;
    chargeInterval: 'NONE' | 'PHASE' | 'GAME';
}

export default function AddEffectModal({
                                           arcshipId,
                                           onClose,
                                       }: {
    arcshipId: string
    onClose(): void
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>()

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        await fetch('/api/effects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: vals.name,
                description: vals.description,
                kind: vals.kind,
                level: vals.level,
                ships: [arcshipId],
                charges: vals.charges ? Number(vals.charges) : null,
                maxCharges: vals.maxCharges ? Number(vals.maxCharges) : null,
                chargeInterval: vals.chargeInterval,
            }),
        })

        // refresh lists
        mutate('/api/effects?ship=null')
        mutate(`/api/effects?ship=${arcshipId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 max-w-md w-full"
            >
                <h3 className="text-lg font-semibold text-white">Add New Effect</h3>

                {/* Name */}
                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && <p className="text-red-400 text-sm">Required</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm text-gray-300">Description</label>
                    <textarea
                        {...register('description', { required: true })}
                        rows={3}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.description && <p className="text-red-400 text-sm">Required</p>}
                </div>

                {/* Level */}
                <div>
                    <label className="block text-sm text-gray-300">Power Level</label>
                    <select
                        {...register('level', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">— Select Level —</option>
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
                    {errors.level && <p className="text-red-400 text-sm">Required</p>}
                </div>

                {/* Kind */}
                <div>
                    <label className="block text-sm text-gray-300">Kind</label>
                    <select
                        {...register('kind', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">— Select Kind —</option>
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                        </select>
                    {errors.kind && <p className="text-red-400 text-sm">Required</p>}
                </div>

                {/* Charge Interval */}
                <div>
                    <label className="block text-sm text-gray-300">Charges (optional)</label>
                    <input
                        type="number"
                        {...register("charges")}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
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
                    <label className="block text-sm text-gray-300">Charge Interval</label>
                    <select
                        {...register('chargeInterval')}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        defaultValue="NONE"
                    >
                        <option value="NONE">None</option>
                        <option value="PHASE">Per Phase</option>
                        <option value="GAME">Per Game</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 border border-gray-500 text-gray-300 rounded hover:text-white"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                        disabled={isSubmitting}
                    >
                        Add Effect
                    </button>
                </div>
            </form>
        </div>
    )
}

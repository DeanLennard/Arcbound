// src/app/(dashboard)/admin/arcships/[[id]]/EditEffectModal.tsx
'use client'
import { useForm, SubmitHandler } from 'react-hook-form'
import React from "react";

export interface Effect {
    _id: string
    name: string
    description: string
    kind: 'Positive' | 'Neutral' | 'Negative'
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
}

interface Props {
    arcshipId: string
    effect: Effect
    isOpen: boolean
    onClose(): void
    mutateEffectList(): void
}

interface FormValues {
    name: string
    description: string
    kind: 'Positive' | 'Neutral' | 'Negative'
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
}

export default function EditEffectModal({
                                            arcshipId,
                                            effect,
                                            isOpen,
                                            onClose,
                                            mutateEffectList,
                                        }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            name: effect.name,
            description: effect.description,
            kind: effect.kind,
            level: effect.level,
        },
    })

    // reset when effect changes
    React.useEffect(() => {
        reset({
            name: effect.name,
            description: effect.description,
            kind: effect.kind,
            level: effect.level,
        })
    }, [effect, reset])

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        await fetch(`/api/effects/${effect._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: vals.name,
                description: vals.description,
                kind: vals.kind,
                level: vals.level,
                ships: { update: arcshipId }, // or whatever your API expects
            }),
        })
        await mutateEffectList()
        onClose()
    }

    if (!isOpen) return null
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 max-w-md w-full"
            >
                <h3 className="text-lg font-semibold text-white">Edit Effect</h3>

                {/* Name */}
                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && (
                        <p className="text-red-400 text-sm">Name is required</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm text-gray-300">Description</label>
                    <textarea
                        {...register('description', { required: true })}
                        rows={3}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.description && (
                        <p className="text-red-400 text-sm">Description is required</p>
                    )}
                </div>

                {/* Level */}
                <div>
                    <label className="block text-sm text-gray-300">Power Level</label>
                    <select
                        {...register('level', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
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
                    {errors.kind && (
                        <p className="text-red-400 text-sm">Kind is required</p>
                    )}
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
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}

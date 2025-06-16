// src/app/(dashboard)/admin/characters/[id]/EditAssetModal.tsx
'use client'

import { useForm, SubmitHandler } from 'react-hook-form'
import { mutate }                 from 'swr'
import { AssetCategory }          from '@/models/CharacterAsset'

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'

interface FormValues {
    name:        string
    description: string
    level:       PowerLevel
    state:       'Active' | 'Inactive'
    apcost?: number
    ebcost?: number
}

export default function EditAssetModal({
                                           asset,
                                           onClose,
                                           onSaved,
                                       }: {
    asset: {
        _id: string
        name: string
        description: string
        level: PowerLevel
        state: 'Active'|'Inactive'
        apcost: number
        ebcost: number
        category: AssetCategory
    }
    onClose(): void
    onSaved(): void
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            name:        asset.name,
            description: asset.description,
            level:       asset.level,
            state:       asset.state,
            apcost:       asset.apcost,
            ebcost:       asset.ebcost,
        },
    })

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        await fetch(`/api/character-assets/${asset._id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(vals),
        })
        onSaved()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4"
            >
                <h3 className="text-xl font-semibold text-white">
                    Edit {asset.category}
                </h3>

                {/* Name */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">Name</label>
                    <input
                        {...register('name', { required: 'Name is required' })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && (
                        <p className="text-red-400 text-xs mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">
                        Description
                    </label>
                    <textarea
                        {...register('description', {
                            required: 'Description is required',
                        })}
                        className="w-full p-2 bg-gray-700 text-white rounded h-24"
                    />
                    {errors.description && (
                        <p className="text-red-400 text-xs mt-1">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                {/* AP Cost */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">AP Cost</label>
                    <input
                        type="number"
                        {...register('apcost', { valueAsNumber: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.apcost && (
                        <p className="text-red-400 text-xs mt-1">
                            {errors.apcost.message}
                        </p>
                    )}
                </div>

                {/* EB Cost */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">EB Cost</label>
                    <input
                        type="number"
                        {...register('ebcost', { valueAsNumber: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.ebcost && (
                        <p className="text-red-400 text-xs mt-1">
                            {errors.ebcost.message}
                        </p>
                    )}
                </div>

                {/* Power Level */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">
                        Power Level
                    </label>
                    <select
                        {...register('level')}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                        {['SPARK','SURGE','FLUX','BREAK','ASCENDANCE'].map(lvl => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                {/* State */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">
                        State
                    </label>
                    <select
                        {...register('state')}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                    >
                        {isSubmitting ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}

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
    buildType?:  'ITEM' | 'IMPLANT';
    buildCredits?:  number;
    buildAlloys?:  number;
    buildEnergy?:  number;
    buildData?:  number;
    buildEssence?:  number;
}

export default function AddAssetModal({
                                          charId,
                                          category,
                                          onClose,
                                      }: {
    charId: string
    category: AssetCategory
    onClose(): void
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            name: '',
            description: '',
            level: 'SPARK',
            state: 'Active',
            apcost: 0,
            ebcost: 0,
            buildType: 'ITEM',
            buildCredits: 0,
            buildAlloys: 0,
            buildEnergy: 0,
            buildData: 0,
            buildEssence: 0
        },
    })

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        await fetch('/api/character-assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...vals,
                category,
                character: charId,
            }),
        })
        // re-fetch this category
        mutate(`/api/character-assets?character=${charId}&category=${category}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl space-y-4"
            >
                <h3 className="text-xl font-semibold text-white">
                    New {category}
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
                        {...register('description')}
                        className="w-full p-2 bg-gray-700 text-white rounded h-24"
                    />
                    {errors.description && (
                        <p className="text-red-400 text-xs mt-1">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* only show build fields for Scrapcode */}
                    {category === 'Scrapcode' && (
                        <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Build Type */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Build Type</label>
                                <select
                                    {...register('buildType', { required: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                    defaultValue="ITEM"
                                >
                                    <option value="ITEM">ITEM</option>
                                    <option value="IMPLANT">IMPLANT</option>
                                </select>
                                {errors.buildType && (
                                    <p className="text-red-400 text-xs mt-1">
                                        Build type is required
                                    </p>
                                )}
                            </div>

                            {/* Build Credits */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                    Build Credits
                                </label>
                                <input
                                    type="number"
                                    {...register('buildCredits', { valueAsNumber: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                />
                                {errors.buildCredits && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.buildCredits.message}
                                    </p>
                                )}
                            </div>

                            {/* Build Alloys */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                    Build Alloys
                                </label>
                                <input
                                    type="number"
                                    {...register('buildAlloys', { valueAsNumber: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                />
                                {errors.buildAlloys && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.buildAlloys.message}
                                    </p>
                                )}
                            </div>

                            {/* Build Energy */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                    Build Energy
                                </label>
                                <input
                                    type="number"
                                    {...register('buildEnergy', { valueAsNumber: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                />
                                {errors.buildEnergy && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.buildEnergy.message}
                                    </p>
                                )}
                            </div>

                            {/* Build Data */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                    Build Data
                                </label>
                                <input
                                    type="number"
                                    {...register('buildData', { valueAsNumber: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                />
                                {errors.buildData && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.buildData.message}
                                    </p>
                                )}
                            </div>

                            {/* Build Essence */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                    Build Essence
                                </label>
                                <input
                                    type="number"
                                    {...register('buildEssence', { valueAsNumber: true })}
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                />
                                {errors.buildEssence && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.buildEssence.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                    >
                        {isSubmitting ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    )
}

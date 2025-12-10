// src/app/(dashboard)/admin/arcships/[id]/AddModuleModal.tsx
'use client';
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { mutate } from 'swr';

interface FormValues {
    name: string;
    description: string;
    state: 'Active' | 'Inactive';
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE';
    charges?: number;
    maxCharges?: number;
    chargeInterval: 'NONE' | 'PHASE' | 'GAME';
}

export interface Module {
    _id: string;
    name: string;
    description: string;
    state: 'Active' | 'Inactive';
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE';
    attachedTo: string;
    charges?: number;
    maxCharges?: number;
    chargeInterval?: 'NONE' | 'PHASE' | 'GAME';
}

export default function EditModuleModal({
                                            module,
                                            arcshipId,
                                            isOpen,
                                            onClose,
                                        }: {
    module: Module;
    arcshipId: string;
    isOpen: boolean;
    onClose(): void;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            name: module.name,
            description: module.description,
            state: module.state,
            level: module.level,
            charges: module.charges ?? 0,
            maxCharges: module.maxCharges ?? 0,
            chargeInterval: module.chargeInterval ?? 'NONE',
        },
    });

    // reset form when module changes
    React.useEffect(() => {
        reset({
            name: module.name,
            description: module.description,
            state: module.state,
            level: module.level,
            charges: module.charges ?? 0,
            maxCharges: module.maxCharges ?? 0,
            chargeInterval: module.chargeInterval ?? 'NONE',
        });
    }, [module, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        const payload = {
            ...vals,
            attachedTo: arcshipId,
        };

        const res = await fetch(`/api/modules/${encodeURIComponent(module._id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Could not update module');

        // refresh attached modules list
        mutate(`/api/modules?attachedTo=${arcshipId}`);
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 max-w-lg w-full"
            >
                <h3 className="text-lg font-semibold text-white">Edit Module</h3>

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
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        rows={3}
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
                        <option value="SPARK">SPARK</option>
                        <option value="SURGE">SURGE</option>
                        <option value="FLUX">FLUX</option>
                        <option value="BREAK">BREAK</option>
                        <option value="ASCENDANCE">ASCENDANCE</option>
                    </select>
                </div>

                {/* State */}
                <div>
                    <label className="block text-sm text-gray-300">State</label>
                    <select
                        {...register('state', { required: true })}
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
    );
}

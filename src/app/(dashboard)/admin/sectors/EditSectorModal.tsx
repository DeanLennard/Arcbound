// src/app/(dashboard)/admin/sectors/EditSectorModal.tsx
'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { mutate } from 'swr';
import type { SectorDoc } from '@/models/Sector';

interface FormValues {
    name: string;
    x: number;
    y: number;
    control: string;
    hasMission: boolean;
}

export default function EditSectorModal({
                                            sector,
                                            onClose,
                                        }: {
    sector: SectorDoc;
    onClose(): void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
        defaultValues: {
            name: sector.name,
            x: sector.x,
            y: sector.y,
            control: sector.control,
            hasMission: sector.hasMission
        }
    });

    React.useEffect(() => {
        reset({
            name: sector.name,
            x: sector.x,
            y: sector.y,
            control: sector.control,
            hasMission: sector.hasMission
        });
    }, [sector, reset]);

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        await fetch(`/api/sectors/${encodeURIComponent(sector._id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vals),
        });
        await mutate('/api/sectors');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-white">Edit Sector</h3>

                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300">X</label>
                        <input
                            type="number"
                            {...register('x', { required: true, valueAsNumber: true })}
                            className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300">Y</label>
                        <input
                            type="number"
                            {...register('y', { required: true, valueAsNumber: true })}
                            className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Control</label>
                    <input
                        {...register('control', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                </div>

                {/* Has Mission */}
                <div>
                    <label className="inline-flex items-center text-sm text-gray-300">
                        <input
                            type="checkbox"
                            {...register('hasMission')}
                            className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span className="ml-2">Has Mission</span>
                    </label>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded"
                        disabled={isSubmitting}
                    >Cancel</button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                        disabled={isSubmitting}
                    >Save Changes</button>
                </div>
            </form>
        </div>
    );
}

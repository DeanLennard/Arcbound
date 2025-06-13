// src/app/(dashboard)/admin/arcships/ArcshipForm.tsx
'use client';
import { useForm } from 'react-hook-form';

export default function ArcshipForm({ initial, onSuccess, onCancel }: any) {
    const { register, handleSubmit, formState: { isSubmitting } } =
        useForm({ defaultValues: initial });
    const isEdit = Boolean(initial._id);

    const onSubmit = async (data: any) => {
        const method = isEdit ? 'PUT' : 'POST';
        const url    = isEdit
            ? `/api/arcships/${initial._id}`
            : '/api/arcships';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.ok) onSuccess();
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 p-6 bg-gray-800 border border-gray-700 rounded-lg"
        >
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-white">Name</label>
                    <input
                        {...register('name', { required: true })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-white">Faction</label>
                    <input
                        {...register('faction')}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* currentSector, benefit, challenge */}
            <div className="grid grid-cols-3 gap-4">
                {['currentSector','benefit','challenge'].map(field => (
                    <div key={field}>
                        <label className="block text-sm font-medium text-white">
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                        </label>
                        <input
                            {...register(field)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                ))}
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-3 gap-6">
                {['hull','core','cmd','crew','nav','sense','intc'].map(key => (
                    <div key={key}>
                        <h4 className="text-white font-semibold mb-1">{key.toUpperCase()}</h4>
                        <label className="block text-xs text-gray-300">Base</label>
                        <input
                            type="number"
                            {...register(`${key}.base`)}
                            className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <label className="block text-xs text-gray-300 mt-2">Mod</label>
                        <input
                            type="number"
                            {...register(`${key}.mod`)}
                            className="mt-1 block w-full px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                ))}
            </div>

            <div className="flex space-x-4 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isEdit ? 'Update' : 'Create'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-transparent border border-gray-500 text-gray-300 rounded hover:border-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

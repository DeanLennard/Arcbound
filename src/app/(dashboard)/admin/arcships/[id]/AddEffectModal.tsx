// src/app/(dashboard)/admin/arcships/[id]/AddEffectModal.tsx
'use client'
import { useState, useMemo } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import { Combobox } from '@headlessui/react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface EffectDoc {
    _id: string
    name: string
    description: string
    kind: 'Positive' | 'Neutral' | 'Negative'
}
interface FormValues {
    effectId: string
    newName?: string
    newDescription?: string
    newKind?: 'Positive' | 'Neutral' | 'Negative'
    level:    'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
}

type Option =
    | EffectDoc
    | { _id: '__new'; name: string; kind?: never; description?: never }

export default function AddEffectModal({
                                           arcshipId,
                                           onClose,
                                       }: {
    arcshipId: string
    onClose(): void
}) {
    // fetch all effects *not* yet on this ship
    const { data: available } = useSWR<EffectDoc[]>(
        `/api/effects?ship=null`,
        fetcher
    )

    // react-hook-form
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { effectId: '' },
    })

    const selectedId = watch('effectId')
    const isNew = selectedId === '__new'

    // Combobox needs an object, so keep track of the whole EffectDoc or a sentinel for “new”
    const [active, setActive] = useState<Option | undefined>(undefined);
    const [query, setQuery] = useState('');

    // whenever user selects, sync into react-hook-form
    function onSelect(item: Option | null) {
        if (item) {
            setActive(item);
            setValue('effectId', item._id, { shouldValidate: true });
        } else {
            // cleared
            setActive(undefined);
            setValue('effectId', '', { shouldValidate: true });
        }
    }

    // filter by the query, then sort alphabetically
    const filtered = useMemo(() => {
        if (!available) return []
            return available
                .filter(e =>
                    e.name.toLowerCase().includes(query.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name))
    }, [available, query])

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        if (isNew) {
            // create & attach
            await fetch('/api/effects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:        vals.newName,
                    description: vals.newDescription,
                    kind:        vals.newKind,
                    level:        vals.level,
                    ships:       [arcshipId],        // your API should push into an array
                }),
            })
        } else {
            // attach existing
            await fetch(`/api/effects/${vals.effectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ships: { add: arcshipId } }),
            })
        }

        // re-load
        mutate(`/api/effects?ship=null`)
        mutate(`/api/effects?ship=${arcshipId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 max-w-md w-full"
            >
                <h3 className="text-lg font-semibold text-white">Attach Effect</h3>

                <Combobox<Option> value={active} onChange={onSelect}>
                    <div className="relative">
                        <Combobox.Input<Option>
                            className="w-full p-2 bg-gray-700 text-white rounded"
                            displayValue={(opt) => opt?.name ?? ''}
                            placeholder="Search or select an effect…"
                            onChange={e => setQuery(e.currentTarget.value)}
                        />
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded bg-white text-black">
                            {filtered.map(e => (
                                <Combobox.Option
                                    key={e._id}
                                    value={e}
                                    className={({ active }) =>
                                        `cursor-pointer px-3 py-2 ${active ? 'bg-indigo-600 text-white' : ''}`
                                    }
                                >
                                    {e.name} <span className="text-sm text-gray-500">({e.kind})</span>
                                </Combobox.Option>
                            ))}
                            <Combobox.Option
                                key="__new"
                                value={{ _id: '__new', name: '+ Create New…' }}
                                className={({ active }) =>
                                    `cursor-pointer px-3 py-2 ${active ? 'bg-indigo-600 text-white' : ''}`
                                }
                            >
                                + Create New Effect…
                            </Combobox.Option>
                        </Combobox.Options>
                    </div>
                </Combobox>

                {errors.effectId && (
                    <p className="text-red-400 text-sm">Please select or create one.</p>
                )}

                {isNew && (
                    <>
                        <div>
                            <label className="block text-sm text-gray-300">Name</label>
                            <input
                                {...register('newName', { required: true })}
                                className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                                placeholder="Effect name"
                            />
                            {errors.newName && (
                                <p className="text-red-400 text-sm">Required</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300">Description</label>
                            <textarea
                                {...register('newDescription', { required: true })}
                                className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                                rows={3}
                                placeholder="Short description"
                            />
                            {errors.newDescription && (
                                <p className="text-red-400 text-sm">Required</p>
                            )}
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
                            <label className="block text-sm text-gray-300">Kind</label>
                            <select
                                {...register('newKind', { required: true })}
                                className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                            >
                                <option value="">— Select Kind —</option>
                                <option value="Positive">Positive</option>
                                <option value="Neutral">Neutral</option>
                                <option value="Negative">Negative</option>
                            </select>
                            {errors.newKind && (
                                <p className="text-red-400 text-sm">Required</p>
                            )}
                        </div>
                    </>
                )}

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 border border-gray-500 text-gray-300 rounded hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                        {isNew ? 'Create & Attach' : 'Attach'}
                    </button>
                </div>
            </form>
        </div>
    )
}

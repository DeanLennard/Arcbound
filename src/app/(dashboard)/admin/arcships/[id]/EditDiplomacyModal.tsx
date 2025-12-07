// src/app/(dashboard)/admin/arcships/[id]/EditDiplomacyModal.tsx
'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import { Combobox } from '@headlessui/react'
import Editor from '@/components/Editor'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ArcshipOption { _id: string; name: string }
export type DiplomacyType =
    | 'Trade Agreement'
    | 'Non Aggression Pact'
    | 'Alliance'
    | 'War'
    | 'Total Annihilation'
    | 'Vassal'

type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE'

// reflect the shape returned on the page: ships as objects
interface PageDiplomacyDoc {
    _id: string
    name: string
    description: string
    type: DiplomacyType
    level: PowerLevel
    ships: { _id: string; name: string }[]
    freeTrade: boolean;
}

interface FormValues {
    name:        string
    description: string
    type:        DiplomacyType
    level:       PowerLevel
    partnerIds:  string[]
    freeTrade: boolean;
}

interface EditDiplomacyModalProps {
    diplomacy: PageDiplomacyDoc
    onClose(): void
}

export default function EditDiplomacyModal({
                                               diplomacy,
                                               onClose,
                                           }: EditDiplomacyModalProps) {
    const { id: selfId } = useParams()!
    const { data: allShips } = useSWR<ArcshipOption[]>('/api/arcships', fetcher)
    const partners = allShips?.filter(s => s._id !== selfId) || []

    // initial partner IDs from object array
    const initialPartners = diplomacy.ships
        .filter(s => s._id !== selfId)
        .map(s => s._id)

    const [query, setQuery] = useState('')
    const filtered = partners.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    )

    const { register, control, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<FormValues>({
            defaultValues: {
                name:        diplomacy.name,
                description: diplomacy.description,
                type:        diplomacy.type,
                level:       diplomacy.level,
                partnerIds:  initialPartners,
                freeTrade: diplomacy.freeTrade ?? false,
            },
        })

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        const ships = [ selfId, ...vals.partnerIds ]
        await fetch(`/api/diplomacy/${encodeURIComponent(diplomacy._id)}`, {
            method: 'PUT',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({
                name:        vals.name,
                description: vals.description,
                type:        vals.type,
                level:       vals.level,
                freeTrade:   vals.freeTrade,
                ships,
            }),
        })
        await mutate(`/api/diplomacy?ship=${selfId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl space-y-4"
            >
                <h3 className="text-xl font-semibold text-white">Edit Diplomacy</h3>

                {/* Name */}
                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input
                        {...register('name',{ required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.name && <p className="text-red-400 text-xs">Required</p>}
                </div>

                {/* Description */}
                {/* Description */}
                <div>
                    <label className="block text-sm text-gray-300">Description</label>
                    <Controller
                        name="description"
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                            <Editor
                                value={value}
                                onChange={onChange}
                            />
                        )}
                    />
                    {errors.description && (
                        <p className="text-red-400 text-xs">Required</p>
                    )}
                </div>

                {/* Level */}
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

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        {...register('freeTrade')}
                        className="h-4 w-4 text-indigo-600"
                    />
                    <label className="text-sm text-gray-300">
                        Allows Free Trade
                    </label>
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm text-gray-300">Type</label>
                    <select
                        {...register('type',{ required: true })}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                        <option value="">— Select Type —</option>
                        {[
                            'Trade Agreement',
                            'Non Aggression Pact',
                            'Alliance',
                            'War',
                            'Total Annihilation',
                            'Vassal',
                        ].map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    {errors.type && <p className="text-red-400 text-xs">Required</p>}
                </div>

                {/* Partners multi-select */}
                <div>
                    <label className="block text-sm text-gray-300">Partners</label>
                    <Controller
                        name="partnerIds"
                        control={control}
                        rules={{ validate: v => v.length > 0 || 'Pick at least one' }}
                        render={({ field: { value, onChange } }) => (
                            <Combobox multiple value={value} onChange={onChange} as="div" className="relative">
                                <Combobox.Input
                                    className="w-full p-2 bg-gray-700 text-white rounded"
                                    placeholder="Type to search…"
                                    onChange={e => setQuery(e.target.value)}
                                />
                                <Combobox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded shadow-lg max-h-60 overflow-auto">
                                    {filtered.length === 0 && query
                                        ? <p className="p-2 text-gray-400">No matches</p>
                                        : filtered.map(s => (
                                            <Combobox.Option
                                                key={s._id}
                                                value={s._id}
                                                className={({ active, selected }) =>
                                                    `p-2 cursor-pointer ${active ? 'bg-indigo-600 text-white' : 'text-gray-200'} ${selected ? 'font-semibold' : ''}`
                                                }
                                            >
                                                {s.name}
                                            </Combobox.Option>
                                        ))}
                                </Combobox.Options>

                                {/* selected tags */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {value.map(pid => {
                                        const ship = partners.find(p => p._id === pid)
                                        return ship && (
                                            <span key={pid} className="flex items-center bg-indigo-600 text-white px-2 py-1 rounded">
                                                {ship.name}
                                                <button
                                                    type="button"
                                                    onClick={() => onChange(value.filter((v: string) => v !== pid))}
                                                    className="ml-1 text-xs"
                                                >×</button>
                                            </span>
                                        )
                                    })}
                                </div>
                            </Combobox>
                        )}
                    />
                    {errors.partnerIds && <p className="text-red-400 text-xs">{errors.partnerIds.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                        {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

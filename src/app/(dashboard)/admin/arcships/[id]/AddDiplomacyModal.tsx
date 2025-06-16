// src/app/(dashboard)/admin/arcships/[id]/AddDiplomacyModal.tsx
'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import useSWR, { mutate } from 'swr'
import { Combobox } from '@headlessui/react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ArcshipOption { _id: string; name: string }
export type DiplomacyType =
    | 'Trade Agreement'
    | 'Non Aggression Pact'
    | 'Alliance'
    | 'War'
    | 'Total Annihilation'
    | 'Vassal'

interface FormValues {
    name:          string
    description:   string
    type:          DiplomacyType
    level:       'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
    partnerIds:    string[]    // all ships in arrangement
}

interface AddDiplomacyModalProps {
    arcshipId: string
    onClose(): void
}

export default function AddDiplomacyModal({ arcshipId, onClose, }: AddDiplomacyModalProps) {
    const { id: selfId } = useParams()!
    const { data: allShips } = useSWR<ArcshipOption[]>('/api/arcships', fetcher)
    const partners = allShips?.filter(s => s._id !== selfId) || []

    const [query, setQuery] = useState('')
    const filtered = partners.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    )

    const { register, control, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<FormValues>({ defaultValues: { name:'', description:'', type: '' as any, partnerIds: [] } })

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        // include yourself plus partners
        const ships = [selfId, ...vals.partnerIds]
        await fetch('/api/diplomacy', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ ...vals, ships })
        })
        // re-load your ship’s list
        mutate(`/api/diplomacy?ship=${selfId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <form onSubmit={handleSubmit(onSubmit)}
                  className="bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
                <h3 className="text-xl font-semibold text-white">New Diplomacy</h3>

                {/* name / description / type */}
                <div>
                    <label className="block text-sm text-gray-300">Name</label>
                    <input {...register('name',{required:true})}
                           className="w-full p-2 bg-gray-700 text-white rounded"/>
                    {errors.name && <p className="text-red-400 text-xs">Required</p>}
                </div>
                <div>
                    <label className="block text-sm text-gray-300">Description</label>
                    <textarea {...register('description',{required:true})}
                              className="w-full p-2 bg-gray-700 text-white rounded h-20"/>
                    {errors.description && <p className="text-red-400 text-xs">Required</p>}
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
                    <label className="block text-sm text-gray-300">Type</label>
                    <select {...register('type',{required:true})}
                            className="w-full p-2 bg-gray-700 text-white rounded">
                        <option value="">— Select Type —</option>
                        {[
                            'Trade Agreement', 'Non Aggression Pact', 'Alliance', 'War', 'Total Annihilation', 'Vassal'
                        ].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.type && <p className="text-red-400 text-xs">Required</p>}
                </div>

                {/* searchable multi-select for partners */}
                <div>
                    <label className="block text-sm text-gray-300">Partners</label>
                    <Controller
                        name="partnerIds"
                        control={control}
                        rules={{ validate: v => v.length>0 || 'Pick at least one' }}
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
                                                    `p-2 cursor-pointer ${active?'bg-indigo-600 text-white':'text-gray-200'} ${selected?'font-semibold':''}`
                                                }
                                            >
                                                {s.name}
                                            </Combobox.Option>
                                        ))
                                    }
                                </Combobox.Options>

                                {/* show tags */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {value.map(id => {
                                        const found = partners.find(p => p._id === id)
                                        return found && (
                                            <span key={id}
                                                  className="flex items-center bg-indigo-600 text-white px-2 py-1 rounded">
                        {found.name}
                                                <button
                                                    type="button"
                                                    onClick={() => onChange(value.filter((v:string)=>v!==id))}
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

                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded">Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded">
                        {isSubmitting ? 'Saving…' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    )
}

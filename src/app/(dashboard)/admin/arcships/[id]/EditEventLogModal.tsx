// src/app/(dashboard)/admin/arcships/[id]/EditEventLogModal.tsx
'use client'

import React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { mutate } from 'swr'
import type { EventLogDoc } from '@/models/EventLog'

interface EditEventLogModalProps {
    arcshipId: string
    log:       EventLogDoc
    isOpen:    boolean
    onClose(): void
}

export interface EventLog {
    _id: string
    eventName: string
    effect: string
    phase: string
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
    ongoing: boolean
}

interface FormValues {
    eventName: string
    effect: string
    phase: string
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
    ongoing: boolean
}

export default function EditEventLogModal({
                                              arcshipId,
                                              log,
                                              isOpen,
                                              onClose,
                                          }: EditEventLogModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            eventName: log.eventName,
            effect: log.effect,
            phase: log.phase,
            level: log.level,
            ongoing: log.ongoing,
        },
    })

    React.useEffect(() => {
        reset({
            eventName: log.eventName,
            effect: log.effect,
            phase: log.phase,
            level: log.level,
            ongoing: log.ongoing,
        })
    }, [log, reset])

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        const rawId = log._id
        // coerce it into a string:
        const idStr = typeof rawId === 'string'
            ? rawId
            : (rawId as { toString(): string }).toString()

        await fetch(`/api/eventlog/${encodeURIComponent(idStr)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: vals.eventName,
                effect: vals.effect,
                phase: vals.phase,
                level: vals.level,
                ongoing: vals.ongoing,
                arcship: arcshipId,
            }),
        })
        await mutate(`/api/eventlog?arcship=${arcshipId}`)
        onClose()
    }

    if (!isOpen) return null
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-white">Edit Event Log</h3>

                <div>
                    <label className="block text-sm text-gray-300">Event Name</label>
                    <input
                        {...register('eventName', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.eventName && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Effect</label>
                    <input
                        {...register('effect', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.effect && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Phase</label>
                    <input
                        {...register('phase', { required: true })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.phase && <p className="text-red-400 text-sm">Required</p>}
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Power Level</label>
                    <select
                        {...register('level')}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    >
                        {['SPARK','SURGE','FLUX','BREAK','ASCENDANCE'].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        {...register('ongoing')}
                        className="h-4 w-4 text-indigo-600 bg-gray-700 rounded"
                    />
                    <label className="text-sm text-gray-300">Ongoing?</label>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-outline"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}

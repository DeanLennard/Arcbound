// src/app/(dashboard)/admin/arcships/[[id]]/AddEventLogModal.tsx
'use client'

import { useForm, SubmitHandler } from 'react-hook-form'
import { mutate }                 from 'swr'

interface FormValues {
    eventName:  string
    effect:     string
    phase:      string
    level:      'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE'
    ongoing:    boolean
}

export default function AddEventLogModal({
                                             arcshipId,
                                             onClose,
                                         }: {
    arcshipId: string
    onClose(): void
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            eventName:  '',
            effect:     '',
            phase:      '',
            level:      'SPARK',
            ongoing:    false,
        }
    })

    const onSubmit: SubmitHandler<FormValues> = async (vals) => {
        await fetch('/api/eventlog', {
            method:  'POST',
            headers: { 'Content-Type':'application/json' },
            body:    JSON.stringify({
                 eventName: vals.eventName,
                 effect:    vals.effect,
                 phase:     vals.phase,
                 level:     vals.level,
                 ongoing:   vals.ongoing,
                 arcship:   arcshipId
           })
        })
        // revalidate the eventLog list
        mutate(`/api/eventlog?arcship=${arcshipId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded space-y-4 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-white">New Event Log</h3>

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
                    <button type="button" onClick={onClose} className="btn-outline">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn">
                        Create
                    </button>
                </div>
            </form>
        </div>
    )
}

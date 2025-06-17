//src/app/(dashboard)/admin/phase/page.tsx
'use client'
import { useEffect }      from 'react'
import useSWR             from 'swr'
import { useForm }        from 'react-hook-form'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface PhaseForm {
    name:   string
    phase:  number
    isOpen: boolean
}

export default function AdminPhasePage() {
    const { data, error, mutate } = useSWR<PhaseForm>('/api/game-phase', fetcher)
    const { register, handleSubmit, reset, formState } = useForm<PhaseForm>()

    // when data loads, populate the form
    useEffect(() => {
        if (data) reset(data)
    }, [data, reset])

    const onSubmit = handleSubmit(async (vals) => {
        const res = await fetch('/api/game-phase', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vals),
        })
        if (res.ok) mutate()    // re-validate
    })

    if (error) return <p className="p-4 text-red-400">Failed to load</p>
    if (!data) return <p className="p-4">Loading…</p>

    return (
        <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 bg-gray-800 rounded space-y-6">
            <h1 className="text-2xl font-bold text-white">Edit Game Phase</h1>

            {/* Name */}
            <div>
                <label className="block text-sm text-gray-200">Name</label>
                <input
                    {...register('name', { required: true })}
                    className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                />
            </div>

            {/* Phase Number */}
            <div>
                <label className="block text-sm text-gray-200">Phase Number</label>
                <input
                    type="number"
                    {...register('phase', { required: true, valueAsNumber: true })}
                    className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                />
            </div>

            {/* Is Open */}
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    {...register('isOpen')}
                    id="isOpen"
                    className="h-4 w-4 text-indigo-600 bg-gray-700 rounded"
                />
                <label htmlFor="isOpen" className="text-gray-200">Phase Open?</label>
            </div>

            <button
                type="submit"
                disabled={formState.isSubmitting}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
                Save
            </button>
        </form>
    )
}

// src/app/(dashboard)/admin/characters/[[id]]/AddPhaseModal.tsx
'use client'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { mutate }                             from 'swr'
import Editor                                  from '@/components/Editor'

interface FormValues {
    number:      number
    interaction: string
    gambit:      string
    resolution:  string
}

export default function AddPhaseModal({
                                          charId,
                                          onClose,
                                      }: {
    charId: string
    onClose(): void
}) {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            number:      1,
            interaction: '',
            gambit:      '',
            resolution:  '',
        },
    })

    const onSubmit: SubmitHandler<FormValues> = async vals => {
        await fetch(`/api/characters/${charId}/phases`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ...vals, character: charId }),
        })
        mutate(`/api/characters/${charId}/phases`)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-gray-800 p-6 rounded-lg space-y-4 w-full max-w-5xl max-h-[80vh] overflow-y-auto"
            >
                <h3 className="text-xl font-semibold text-white">New Phase</h3>

                {/* Phase Number */}
                <div>
                    <label className="block text-sm text-gray-300">Phase Number</label>
                    <input
                        type="number"
                        {...register('number', { required: true, min: 1 })}
                        className="mt-1 w-full p-2 bg-gray-700 text-white rounded"
                    />
                    {errors.number && (
                        <p className="text-red-400 text-sm">Required &gt;= 1</p>
                    )}
                </div>

                {/* Interaction */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">Interaction</label>
                    <Controller
                        name="interaction"
                        control={control}
                        render={({ field }) => (
                            <Editor
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    {errors.interaction && (
                        <p className="text-red-400 text-sm">This field is required</p>
                    )}
                </div>

                {/* Gambit */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">Gambit</label>
                    <Controller
                        name="gambit"
                        control={control}
                        render={({ field }) => (
                            <Editor
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    {errors.gambit && (
                        <p className="text-red-400 text-sm">This field is required</p>
                    )}
                </div>

                {/* Resolution */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">Resolution</label>
                    <Controller
                        name="resolution"
                        control={control}
                        render={({ field }) => (
                            <Editor
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    {errors.resolution && (
                        <p className="text-red-400 text-sm">This field is required</p>
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
                        {isSubmitting ? 'Saving…' : 'Add Phase'}
                    </button>
                </div>
            </form>
        </div>
    )
}

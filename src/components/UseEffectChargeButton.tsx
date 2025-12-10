'use client'

export default function UseEffectChargeButton({
                                                  effectId,
                                                  onUsed
                                              }: {
    effectId: string
    onUsed?: () => void
}) {
    return (
        <button
            className="btn-sm bg-yellow-600 text-white px-2 py-1 rounded"
            onClick={async () => {
                await fetch(`/api/effects/${effectId}/use-charge`, {
                    method: 'POST'
                })
                onUsed?.()
            }}
        >
            Use Charge
        </button>
    )
}

// src/components/UseEffectChargeButton.tsx
'use client'

export default function UseEffectChargeButton({
                                                  effectId,
                                                  onUsed
                                              }: {
    effectId: string
    onUsed?: (newCharges: number) => void
}) {
    return (
        <button
            className="btn-sm bg-yellow-600 text-white px-2 py-1 rounded"
            onClick={async () => {
                const res = await fetch(`/api/effects/${effectId}/use-charge`, {
                    method: 'POST'
                });

                const json = await res.json();
                if (json?.charges !== undefined) {
                    onUsed?.(json.charges);
                }
            }}
        >
            Use Charge
        </button>
    );
}

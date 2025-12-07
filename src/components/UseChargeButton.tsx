// src/components/UseChargeButton.tsx
'use client'

export default function UseChargeButton({
                                            assetId,
                                            onUsed
                                        }: {
    assetId: string
    onUsed?: () => void
}) {
    return (
        <button
            className="btn-sm bg-yellow-600 text-white px-2 py-1 rounded"
            onClick={async () => {
                await fetch(`/api/character-assets/${assetId}/use-charge`, {
                    method: 'POST'
                });
                onUsed?.();
            }}
        >
            Use Charge
        </button>
    );
}

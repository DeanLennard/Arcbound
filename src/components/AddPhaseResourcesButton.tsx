'use client';

export default function AddPhaseResourcesButton({ shipId }: { shipId: string }) {
    return (
        <button
            onClick={async () => {
                await fetch(`/api/arcships/add-phase-resources`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shipId })
                });
                location.reload();
            }}
            className="mb-3 px-3 py-1 bg-indigo-600 text-white rounded"
        >
            Add Phase Resources
        </button>
    );
}

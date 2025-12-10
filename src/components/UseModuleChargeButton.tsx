// src/components/UseModuleChargeButton.tsx
'use client';

import { useState } from 'react';

export default function UseModuleChargeButton({
                                                  moduleId,
                                                  onUsed,
                                              }: {
    moduleId: string;
    onUsed(newCharges: number): void;
}) {
    const [loading, setLoading] = useState(false);

    const handleUse = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/modules/${moduleId}/use-charge`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('Failed to use charge');
            const data = await res.json(); // { charges: number }

            onUsed(data.charges);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleUse}
            disabled={loading}
            className="ml-2 px-2 py-1 text-xs bg-yellow-500 rounded text-black hover:bg-yellow-600"
        >
            {loading ? '...' : 'Use Charge'}
        </button>
    );
}

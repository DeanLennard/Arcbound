// src/components/PhaseHistoryClient.tsx
'use client'

import dynamic from 'next/dynamic'

// dynamically load your accordion/search UI on the client only
const PhaseHistory = dynamic(
    () => import('@/components/PhaseHistory'),
    { ssr: false }
)

export default PhaseHistory

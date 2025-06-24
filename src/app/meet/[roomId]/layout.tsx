// app/meet/[roomId]/layout.tsx
'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function MeetLayout({ children }: { children: ReactNode }) {
    return (
        <div className="w-screen h-screen flex flex-col bg-gray-900">
            {children}
        </div>
    );
}

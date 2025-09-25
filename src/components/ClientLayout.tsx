//components/ClientLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

declare global {
    interface Window {
        handleImageClick: (src: string) => void;
    }
}

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState('');

    useEffect(() => {
        // Add a global function for image click
        window.handleImageClick = (src: string) => {
            setLightboxImage(src);
            setLightboxOpen(true);
        };
    }, []);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    }, []);

    useEffect(() => {
        const registerPush = async () => {
            const res = await fetch('/api/auth/session');
            const session = await res.json();

            if (session?.user && 'serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.register('/sw.js');
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                });

                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
            }
        };

        registerPush();
    }, []);

    return (
        <SessionProvider
            refetchInterval={60}
            refetchOnWindowFocus={true}
        >
            {children}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={[{ src: lightboxImage }]}
            />
        </SessionProvider>
    );
}

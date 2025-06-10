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

    return (
        <SessionProvider>
            {children}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={[{ src: lightboxImage }]}
            />
        </SessionProvider>
    );
}

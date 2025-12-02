// src/components/ModalPortal.tsx
'use client';
import { createPortal } from 'react-dom';

export default function ModalPortal({ children }: { children: React.ReactNode }) {
    if (typeof window === 'undefined') return null;
    return createPortal(children, document.body);
}

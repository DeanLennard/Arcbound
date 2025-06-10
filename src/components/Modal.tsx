// src/components/Modal.tsx
"use client";
import React from "react";

interface Props {
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ onClose, children }: Props) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded p-4 max-w-2xl w-full">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    X
                </button>
                {children}
            </div>
        </div>
    );
}

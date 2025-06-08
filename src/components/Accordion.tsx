// src/components/Accordion.tsx
'use client';

import React, { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

interface AccordionProps {
    items: FAQItem[];
}

export default function Accordion({ items }: AccordionProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={index} className="border border-gray-600 rounded">
                    <button
                        className="w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold flex justify-between items-center"
                        onClick={() => toggleItem(index)}
                    >
                        <span>{item.question}</span>
                        <svg
                            className={`w-5 h-5 transform transition-transform ${
                                activeIndex === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    {activeIndex === index && (
                        <div className="px-4 py-2 bg-gray-700 text-white">
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

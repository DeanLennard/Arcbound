// src/app/tools/page.tsx
'use client';

import React from 'react';
import Accordion from '@/components/Accordion';

const faqs = [
    {
        question: "What’s an Arcship?",
        answer:
            "A colossal star-faring city-state—your mobile base, battlefield, temple, or vault. Arcships have their own stats, modules, and personalities.",
    },
    {
        question: "Do I need a crew to play?",
        answer:
            "While a crew enriches the experience, solo play is absolutely possible. Players can join community-run crews or operate independently.",
    },
    {
        question: "Can we design our own Arcship?",
        answer:
            "Absolutely! Our tools let you customize your Arcship's modules, abilities, and backstory. Shape your ship to match your narrative and gameplay style.",
    },
    {
        question: "What is Arcbound?",
        answer:
            "A narrative-driven science-fantasy roleplay game set in a collapsing galaxy. Players control powerful characters aboard massive starships called Arcships, navigating diplomacy, war, metaphysical horror, and personal legacy.",
    },
    {
        question: "How do I play?",
        answer:
            "Each real-world month/phase, you submit your character’s actions (Standard Protocol + Gambit), engage in roleplay, and help shape the galaxy’s story. You play either solo or as part of a crew on an Arcship.",
    },
    {
        question: "Is this a tabletop RPG? LARP? Forum RP?",
        answer:
            "It’s a hybrid: a collaborative narrative LARP with elements of tabletop. There's no dice at the player level—outcomes are story and system-driven.",
    },
    {
        question: "How much time does this take to play?",
        answer:
            "Absolutely! Our tools let you customize your Arcship's modules, abilities, and backstory. Shape your ship to match your narrative and gameplay style.",
    },
    {
        question: "Can we design our own Arcship?",
        answer:
            "It’s designed to be flexible. You can be active daily through RP, or just engage a couple of times a week and keep up that way. You choose your level of engagement. It will be frowned upon if you don't engage at all and just submit actions.",
    },
    {
        question: "What kinds of characters can I play?",
        answer:
            "Anything from psionic diplomats to war-scarred zealots to AI-infused engineers. Your Role determines your powers and focus—choose from 12 unique archetypes.",
    },
    {
        question: "Do I have to be in a faction?",
        answer:
            "You must start in one of six major factions, if you want to leave you can but that's a major story event and there will be consequences. Freelancers and rogues do exist though.",
    },
    {
        question: "Can I switch factions or Roles later?",
        answer:
            "Factions: Yes, but it’s a major story event." +
            "Roles: No—your Role is your foundation. But you grow in wildly different directions based on your Shards and choices.",
    },
];

// Reusable Tool Button
const ToolButton = ({ label, link }: { label: string; link: string }) => (
    <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-center shadow"
    >
        {label}
    </a>
);

// Smaller Tool Button
const SmallToolButton = ({ label, link }: { label: string; link: string }) => (
    <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded text-center text-xs shadow"
    >
        {label}
    </a>
);

export default function ToolsPage() {
    return (
        <main className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4">
            <section className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Welcome to Arcbound Tools</h1>
                <p className="text-gray-400">
                    Explore resources, manage your game, and more!
                </p>
            </section>

            {/* Donate Button */}
            <div className="flex justify-center mb-8">
                <a
                    href="https://donate.stripe.com/5kAg068fLdGp1IQcMM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded font-semibold shadow"
                >
                    Donate To Our Running Costs
                </a>
            </div>

            {/* 3 Columns of 3 Buttons */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Column 1 */}
                <div className="space-y-4">
                    <ToolButton label="Admin Form" link="https://forms.gle/NmhGTzwKueQuQfaR6" />
                    <ToolButton label="Phase Submission Form" link="https://forms.gle/ayPi4gDvykYMp8v86" />
                    <ToolButton label="Feedback & Complaints" link="https://forms.gle/gwcKLbFKe92dmPwf9" />
                </div>
                {/* Column 2 */}
                <div className="space-y-4">
                    <ToolButton label="Sector Map" link="https://www.arcbound.co.uk/sectormap" />
                    <ToolButton label="The Ledger" link="https://docs.google.com/document/d/1NEvFhh8uYreNRV6xGKUgH7pUOPQ1Sg1_WHl1talpDrs/edit?usp=sharing" />
                    <ToolButton label="General Arcship Modules" link="https://docs.google.com/document/d/10dG6ko-TbMY7tDl3tPtLaNoipRMXYQaHbOJne5xZ7Qw/edit?usp=sharing" />
                    <ToolButton label="Global Ritual Library" link="https://docs.google.com/document/d/12uhsGo6pbvJrCmsA07FOQuBzM71S5hfwfBHdvqX4EIk/edit?usp=sharing" />
                </div>
                {/* Column 3 */}
                <div className="space-y-4">
                    <ToolButton label="Rulebook" link="https://docs.google.com/document/d/1j72B69r4PFGzMF5YOVXMgkHqqPZZCDwFf1qwywjUXZg/edit?usp=sharing" />
                    <ToolButton label="New Arcship Form" link="https://forms.gle/JbrodrZBrqFTErBZ8" />
                    <ToolButton label="New Character Form" link="https://forms.gle/WNwvtz8WV4o5eeNZ8" />
                </div>
            </section>

            {/* 2 Rows of 6 Smaller Buttons */}
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <SmallToolButton label="Echo Weaver" link="https://docs.google.com/document/d/12L3f03yygIHriOtrEaqEXxjhpLwWWzOz8g1sbk7Izic/edit?tab=t.0" />
                <SmallToolButton label="Envoy" link="https://docs.google.com/document/d/1ylHHpu4S1bmm8gWIR29j7vilaPPTxdeKBmyVL0bxk8I/edit?usp=sharing" />
                <SmallToolButton label="Gunslinger" link="https://docs.google.com/document/d/1Q_B_t-oY8l8Bv1RkjHVM4lX6NFhiyS3QHJ1uG2chs9U/edit?usp=sharing" />
                <SmallToolButton label="Shadow Operative" link="https://docs.google.com/document/d/10zEl-l050pid5pr6Hf6HYErxE-9Mn2xixxciyqKuU20/edit?usp=sharing" />
                <SmallToolButton label="Systems Fixer" link="https://docs.google.com/document/d/1aG4J0mawFJ1_YgNvUuH_RgWnGzRkTS26hZ6Xni2YNog/edit?usp=sharing" />
                <SmallToolButton label="Technomancer" link="https://docs.google.com/document/d/159iWkVzRkAjGRHUDJa0pdyypOtPAU-6wqySjejRhhDk/edit?usp=sharing" />
                <SmallToolButton label="Vanguard" link="https://docs.google.com/document/d/1zLyZpdIckhum9bmULqVK7ZeDISCCrifK15j6DmH1Ysk/edit?usp=sharing" />
                <SmallToolButton label="Void Mechanic" link="https://docs.google.com/document/d/1JTNdoyuNiCO_ZnhusSAMdBc83gIsI_etZab8BUio32g/edit?usp=sharing" />
            </section>

            <section className="mt-12">
                <h2 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h2>
                <Accordion items={faqs} />
            </section>
        </main>
    );
}

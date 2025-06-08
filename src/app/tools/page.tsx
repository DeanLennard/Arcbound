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
                    <ToolButton label="Sector Map" link="https://miro.com/app/board/uXjVIJD6C_M=/?share_link_id=18936603177" />
                    <ToolButton label="The Ledger" link="https://docs.google.com/document/d/1lD5DNBUxFVmtjBcBng4VY-k-Ssg37z9DoC3HoIKTOXQ/edit?usp=sharing" />
                    <ToolButton label="General Arcship Modules" link="https://docs.google.com/document/d/1gMFkhX_yIvgwFEwyStmThvl0xCdAvYutwD3vkLdW51w/edit?usp=sharing" />
                </div>
                {/* Column 3 */}
                <div className="space-y-4">
                    <ToolButton label="Rulebook" link="https://docs.google.com/document/d/1xNm3ATJLBjnorL39ZdyZ4hsi21F5TIzTDOPZ-lU4yRY/edit?usp=sharing" />
                    <ToolButton label="New Arcship Form" link="https://forms.gle/JbrodrZBrqFTErBZ8" />
                    <ToolButton label="New Character Form" link="https://forms.gle/WNwvtz8WV4o5eeNZ8" />
                </div>
            </section>

            {/* 2 Rows of 6 Smaller Buttons */}
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <SmallToolButton label="Vanguard" link="https://docs.google.com/document/d/12FD9omcp1_ejR3cp3BMihJIuomx6fiMQpiyrt1VG980/edit?usp=drive_link" />
                <SmallToolButton label="Tactician" link="https://docs.google.com/document/d/1T7M-dEVeYTvb05gFkkqX6pZ85IUrN8B-hiOGnxtXnfs/edit?usp=drive_link" />
                <SmallToolButton label="Operative" link="https://docs.google.com/document/d/1pppVQFI2TvcVcZ3EgKqlPrFWJnx2R1ISo4bf8TMJkTA/edit?usp=drive_link" />
                <SmallToolButton label="Echochanter" link="https://docs.google.com/document/d/1vg4ed-XltWjnj0uuVcjdnsBm3GE3HnJZbhVjhtZKD6w/edit?usp=drive_link" />
                <SmallToolButton label="Systems Architect" link="https://docs.google.com/document/d/1R3SHlrgkr8hTdoY4EeT-oN0QmvdEBELMJTUoX-at644/edit?usp=drive_link" />
                <SmallToolButton label="Envoy" link="https://docs.google.com/document/d/1v2eCLr7gLZyRtLALkowf7AD-yzowU5gj6xrysDu7Y98/edit?usp=drive_link" />
                <SmallToolButton label="Shadowbroker" link="https://docs.google.com/document/d/1ew6ye7BOmndG-wbqAg3VxIbYCtIT8d4FaGprOwEWw-U/edit?usp=drive_link" />
                <SmallToolButton label="Gunslinger" link="https://docs.google.com/document/d/1NisOqGieujIPdvaUcyyd0lvMz5i4f2lC1axEUShaAik/edit?usp=drive_link" />
                <SmallToolButton label="Technomancer" link="https://docs.google.com/document/d/14SbV3Uts5J2UD9qyhuYuq5RnKbzpvjCkX7qXonTulCM/edit?usp=drive_link" />
                <SmallToolButton label="Wyrdweaver" link="https://docs.google.com/document/d/1v1wHtXGF2S3Kk0qfYnZIUfAZWjWG0SvDb5i_I_y8X8E/edit?usp=drive_link" />
                <SmallToolButton label="Void Mechanic" link="https://docs.google.com/document/d/1EiWy7qbogcoc7OWvqbKkdkdcwhh9Eytwae6ujkubm7E/edit?usp=drive_link" />
                <SmallToolButton label="Fixer" link="https://docs.google.com/document/d/1pk4mmDDIEEaJhXHUIj9BvmUMqTsndSHlxxiROjx1Ir8/edit?usp=drive_link" />
            </section>

            <section className="mt-12">
                <h2 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h2>
                <Accordion items={faqs} />
            </section>
        </main>
    );
}

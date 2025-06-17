// src/components/Header.tsx
'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { BellIcon, Menu, X } from 'lucide-react'
import { Combobox } from '@headlessui/react'

// pull in your summary types
import type { CharacterSummary } from '@/pages/api/characters/my'
import type { ShipSummary }      from '@/pages/api/arcships/my'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Header() {
    const router = useRouter()
    const { data: session } = useSession()
    const [unread, setUnread] = useState(0)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        if (session) {
            fetch('/api/notifications/unread-count')
                .then(r => r.json())
                .then(d => setUnread(d.unreadCount || 0))
                .catch(console.error)
        }
    }, [session])

    // 1) all my chars & ships, properly typed
    const { data: myChars } = useSWR<CharacterSummary[]>(
        session ? '/api/characters/my' : null,
        fetcher
    )
    const { data: myShips } = useSWR<ShipSummary[]>(
        session ? '/api/arcships/my' : null,
        fetcher
    )

    // 2) local query & filtering for multi-select
    const [charQuery, setCharQuery] = useState('')
    const filteredChars = (myChars || []).filter(c =>
        c.charName.toLowerCase().includes(charQuery.toLowerCase())
    )

    const [shipQuery, setShipQuery] = useState('')
    const filteredShips = (myShips || []).filter(s =>
        s.name.toLowerCase().includes(shipQuery.toLowerCase())
    )

    const toggleMenu = () => setMenuOpen(o => !o)

    return (
        <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center relative">
            {/* Left: Logo + nav */}
            <div className="flex items-center gap-4">
                <Link href="/forum" className="text-xl font-bold hover:underline">
                    Arcbound
                </Link>
                <nav className="hidden md:flex items-center gap-4">
                    <Link href="/" className="hover:underline">Home</Link>
                    <Link href="/forum" className="hover:underline">Relay</Link>
                    <Link href="/tools" className="hover:underline">Tools</Link>
                </nav>
            </div>

            {/* Right: user actions */}
            <div className="flex items-center gap-2">
                {session ? (
                    <>
                        {/* notifications */}
                        <Link href="/notifications" className="relative">
                            <BellIcon className="w-6 h-6" />
                            {unread > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-xs rounded-full px-1">
                                  {unread}
                                </span>
                            )}
                        </Link>

                        {/* single vs multiple chars */}
                        <div className="hidden md:block">
                            {myChars && myChars.length === 1 ? (
                                <Link
                                    href={`/characters/${myChars[0]._id}`}
                                    className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-sm"
                                >
                                    My Character: {myChars[0].charName}
                                </Link>
                            ) : myChars && myChars.length > 1 ? (
                                <Combobox<CharacterSummary | undefined>
                                    value={undefined}
                                    onChange={(c?: CharacterSummary) => {
                                        if (c) router.push(`/characters/${c._id}`)
                                    }}
                                >
                                    <div className="relative">
                                        <Combobox.Button className="absolute inset-y-0 right-0 px-2 flex items-center">
                                            ▼
                                        </Combobox.Button>
                                        <Combobox.Input
                                            className="bg-indigo-600 text-white px-2 py-1 rounded text-sm"
                                            placeholder="Choose Character…"
                                            onFocus={() => setCharQuery('')}
                                            onChange={e => setCharQuery(e.target.value)}
                                            displayValue={(c?: CharacterSummary) => c?.charName || ''}
                                        />
                                        <Combobox.Options className="absolute mt-1 w-full bg-gray-800 rounded max-h-48 overflow-auto z-50">
                                            {filteredChars.map(c => (
                                                <Combobox.Option
                                                    key={c._id}
                                                    value={c}
                                                    className={({ active }) =>
                                                        `px-3 py-1 cursor-pointer ${
                                                            active ? 'bg-indigo-700 text-white' : 'text-gray-200'
                                                        }`
                                                    }
                                                >
                                                    {c.charName}
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                            ) : null}
                        </div>

                        {/* single vs multiple ships */}
                        <div className="hidden md:block">
                            {myShips && myShips.length === 1 ? (
                                <Link
                                    href={`/arcships/${myShips[0]._id}`}
                                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
                                >
                                    My Ship: {myShips[0].name}
                                </Link>
                            ) : myShips && myShips.length > 1 ? (
                                <Combobox<ShipSummary | undefined>
                                    value={undefined}
                                    onChange={(s?: ShipSummary) => {
                                        if (s) router.push(`/arcships/${s._id}`)
                                    }}
                                >
                                    <div className="relative">
                                        <Combobox.Button className="absolute inset-y-0 right-0 px-2 flex items-center">
                                            ▼
                                        </Combobox.Button>
                                        <Combobox.Input
                                            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                                            placeholder="Choose Ship…"
                                            onFocus={() => setShipQuery('')}
                                            onChange={e => setShipQuery(e.target.value)}
                                            displayValue={(s?: ShipSummary) => s?.name || ''}
                                        />
                                        <Combobox.Options className="absolute mt-1 w-full bg-gray-800 rounded max-h-48 overflow-auto z-50">
                                            {filteredShips.map(s => (
                                                <Combobox.Option
                                                    key={s._id}
                                                    value={s}
                                                    className={({ active }) =>
                                                        `px-3 py-1 cursor-pointer ${
                                                            active ? 'bg-green-700 text-white' : 'text-gray-200'
                                                        }`
                                                    }
                                                >
                                                    {s.name}
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                            ) : null}
                        </div>

                        {/* profile & logout */}
                        <Link
                            href={`/profile/${session.user.id}`}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Profile
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login"    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded hidden md:inline">Login</Link>
                        <Link href="/register" className="bg-blue-600  hover:bg-blue-700 px-3 py-1 rounded hidden md:inline">Register</Link>
                    </>
                )}

                {/* mobile menu button */}
                <button onClick={toggleMenu} className="md:hidden">
                    {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* mobile dropdown */}
            {menuOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-900 flex flex-col gap-2 px-4 py-3 z-50">
                    <Link href="/" onClick={toggleMenu} className="hover:underline">Home</Link>
                    <Link href="/forum" onClick={toggleMenu} className="hover:underline">Relay</Link>
                    <Link href="/tools" onClick={toggleMenu} className="hover:underline">Tools</Link>

                    {/* ——— My Character ——— */}
                    {session && myChars && myChars.length > 0 && (
                        myChars.length === 1 ? (
                            <Link
                                href={`/characters/${myChars[0]._id}`}
                                onClick={toggleMenu}
                                className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-sm"
                            >
                                My Character: {myChars[0].charName}
                            </Link>
                        ) : (
                            <select
                                className="bg-indigo-600 text-white px-2 py-1 rounded text-sm"
                                defaultValue=""
                                onChange={e => {
                                    const id = e.target.value
                                    if (id) {
                                        router.push(`/characters/${id}`)
                                        toggleMenu()
                                    }
                                }}
                            >
                                <option value="">Choose Character…</option>
                                {myChars.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.charName}
                                    </option>
                                ))}
                            </select>
                        )
                    )}

                    {/* ——— My Ship ——— */}
                    {session && myShips && myShips.length > 0 && (
                        myShips.length === 1 ? (
                            <Link
                                href={`/arcships/${myShips[0]._id}`}
                                onClick={toggleMenu}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
                            >
                                My Ship: {myShips[0].name}
                            </Link>
                        ) : (
                            <select
                                className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                                defaultValue=""
                                onChange={e => {
                                    const id = e.target.value
                                    if (id) {
                                        router.push(`/arcships/${id}`)
                                        toggleMenu()
                                    }
                                }}
                            >
                                <option value="">Choose Ship…</option>
                                {myShips.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        )
                    )}

                    {/* profile & logout */}
                    {session ? (
                        <>
                            <Link
                                href={`/profile/${session.user.id}`}
                                onClick={toggleMenu}
                                className="hover:underline"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={() => { signOut(); toggleMenu(); }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                onClick={toggleMenu}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                onClick={toggleMenu}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    )
}

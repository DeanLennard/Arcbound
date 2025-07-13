// src/app/(dashboard)/admin/characters/CharacterForm.tsx
'use client'

import { Controller, useForm, SubmitHandler } from 'react-hook-form'
import useSWR from 'swr'
import { useEffect } from 'react'
import Editor from '@/components/Editor'
import { Switch } from '@headlessui/react'

interface UserOption {
    _id: string
    playerName: string
}

interface ArcshipOption {
    _id: string
    name: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

// static lists
const FACTIONS = [
    'The Aeon Collective',
    'The Helion Federation',
    'The Korveth Dominion',
    'The Sundered Concord',
    'The Tyr Solaris Imperium',
    'The Virean Ascendancy',
    'Other',
]

const ROLES = [
    'Echo Weaver',
    'Envoy',
    'Gunslinger',
    'Shadow Operative',
    'Systems Fixer',
    'Technomancer',
    'Vanguard',
    'Void Mechanic',
    'Other',
]

const RACES_BY_FACTION: Record<string, string[]> = {
    'The Aeon Collective':      ['Nthari (Xenar)', 'Lumen-Born (Nytherian)', 'Glassbound (Synth)'],
    'The Helion Federation':    ['Protocolians (Synth)', 'Heliostructs (Splicer)', 'Ascendral (Prime)'],
    'The Korveth Dominion':     ['Brandborn (Splicer)', 'Ledger Units (Synth)', 'Vantari (Prime)'],
    'The Sundered Concord':     ["Vul'theri (Xenar)", 'Fractors (Splicer)', 'Dustborn (Prime)'],
    'The Tyr Solaris Imperium': ['Aurel Sentinels (Nytherian)', 'Solarblood (Prime)', 'Valgyn (Synth)'],
    'The Virean Ascendancy':    ['Ecliptans (Nytherian)', 'Vessakar (Splicer)', 'Verdanites (Prime)'],
}

// flatten all into a unique list
const ALL_RACES = Array.from(
    new Set(Object.values(RACES_BY_FACTION).flat())
).sort()

interface CharacterFormValues {
    _id?: string
    arcship: string
    user:    string
    charName: string
    status:  'Active' | 'Dead' | 'Retired'
    faction: string
    factionCustom?: string
    role:    string
    roleCustom?: string
    race:    string
    raceCustom?: string
    archetype: string
    npc: boolean
}

export interface CharacterFormData {
    _id?:          string;
    arcship:       string;
    user:          string;
    charName:      string;
    status:        'Active'|'Dead'|'Retired';
    faction:       string;
    factionCustom?: string;
    role:          string;
    roleCustom?:   string;
    race:          string;
    raceCustom?:   string;
    archetype:     string;
    npc:           boolean
    background?:         string
    factionObjective?:   string
}

interface CharacterFormProps {
    initial: Partial<CharacterFormValues>
    onSuccess(): void
    onCancel(): void
}

export default function CharacterForm({ initial, onSuccess, onCancel }: CharacterFormProps) {
    const {
        control,
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { isSubmitting }
    } = useForm<CharacterFormData>({
        defaultValues: {
            ...initial,
            npc: initial.npc ?? false,
        }
    })

    const isEdit = Boolean(initial._id)

    // load users
    const { data: userData, error: userError } = useSWR<{ users: UserOption[] }>('/api/users/all', fetcher)
    // load arcships
    const { data: arcData, error: arcError } = useSWR<ArcshipOption[]>('/api/arcships', fetcher)

    // arcData may be undefined until it loads, so default to an empty array
    const sortedArcships = (arcData ?? [])
        .slice()  // make a shallow copy
        .sort((a, b) => a.name.localeCompare(b.name))

    // userData may be undefined too, and userData.users may be undefined
    const sortedUsers = (userData?.users ?? [])
        .slice()
        .sort((a, b) => a.playerName.localeCompare(b.playerName))

    // reset form on new initial
    useEffect(() => {
        if (!initial) return
        reset({
            ...initial,
            npc: initial.npc ?? false,
        })
    }, [initial, reset])

    // watch fields for dynamic logic
    const selectedFaction = watch('faction')
    const selectedRole    = watch('role')
    const selectedRace    = watch('race')
    const bg      = watch('background') || ''
    const factionObj = watch('factionObjective') || ''

    // auto‐set archetype when a non‐Other race is chosen
    useEffect(() => {
        if (selectedRace && selectedRace !== 'Other') {
            const m = selectedRace.match(/\(([^)]+)\)$/)
            setValue('archetype', m ? m[1] : '')
        }
    }, [selectedRace, setValue])

    const onSubmit: SubmitHandler<CharacterFormValues> = async (data) => {
        // swap in custom values if “Other”
        if (data.faction === 'Other') data.faction = data.factionCustom!
        if (data.role    === 'Other') data.role    = data.roleCustom!
        if (data.race    === 'Other') data.race    = data.raceCustom!

        delete data.factionCustom
        delete data.roleCustom
        delete data.raceCustom

        const method = isEdit ? 'PUT' : 'POST'
        const url    = isEdit
            ? `/api/characters/${initial._id}`
            : '/api/characters'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (res.ok) onSuccess()
    }

    if (userError || arcError) {
        return <p className="p-6 text-red-400">Failed to load players or arcships</p>
    }
    if (!userData || !arcData) {
        return <p className="p-6">Loading…</p>
    }

    // pick race list: either faction‐based or all
    const races =
        selectedFaction === 'Other'
            ? ALL_RACES
            : RACES_BY_FACTION[selectedFaction] || []

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 p-6 bg-gray-800 border border-gray-700 rounded-lg"
        >
            {/* Arcship selector */}
            <div>
                <label className="block text-sm font-medium text-white">Arcship</label>
                <select
                    {...register('arcship')}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">— Unassigned —</option>
                    {sortedArcships.map(a => (
                        <option key={a._id} value={a._id}>
                            {a.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Player */}
            <div>
                <label className="block text-sm font-medium text-white">Player</label>
                <select
                    {...register('user', { required: true })}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">— Select Player —</option>
                    {sortedUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.playerName}</option>
                    ))}
                </select>
            </div>

            {/* Character Name */}
            <div>
                <label className="block text-sm font-medium text-white">Character Name</label>
                <input
                    {...register('charName', { required: true })}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* NPC toggle */}
            <Controller
                control={control}
                name="npc"
                render={({ field: { value, onChange } }) => (
                    <Switch.Group as="div" className="flex items-center space-x-4">
                        <Switch.Label className="text-sm font-medium text-white">NPC</Switch.Label>
                        <Switch
                            checked={value}
                            onChange={onChange}
                            className={
                                (value ? 'bg-indigo-600' : 'bg-gray-500') +
                                ' relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            }
                        >
              <span
                  className={
                      (value ? 'translate-x-6' : 'translate-x-1') +
                      ' inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                  }
              />
                        </Switch>
                    </Switch.Group>
                )}
            />

            {/* Status, Faction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-white">Status</label>
                    <select
                        {...register('status')}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Active">Active</option>
                        <option value="Dead">Dead</option>
                        <option value="Retired">Retired</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white">Faction</label>
                    <select
                        {...register('faction', { required: true })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">— Select Faction —</option>
                        {FACTIONS.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    {selectedFaction === 'Other' && (
                        <input
                            {...register('factionCustom', { required: true })}
                            placeholder="Enter custom faction"
                            className="mt-2 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                </div>
            </div>

            {/* Role */}
            <div>
                <label className="block text-sm font-medium text-white">Role</label>
                <select
                    {...register('role', { required: true })}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">— Select Role —</option>
                    {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                {selectedRole === 'Other' && (
                    <input
                        {...register('roleCustom', { required: true })}
                        placeholder="Enter custom role"
                        className="mt-2 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                )}
            </div>

            {/* Race & Archetype */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-white">Race</label>
                    <select
                        {...register('race', { required: true })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">— Select Race —</option>
                        {races.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                        <option value="Other">Other</option>
                    </select>
                    {selectedRace === 'Other' && (
                        <input
                            {...register('raceCustom', { required: true })}
                            placeholder="Enter custom race"
                            className="mt-2 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-white">Archetype</label>
                    {selectedRace === 'Other' ? (
                        <input
                            {...register('archetype', { required: true })}
                            placeholder="Enter custom archetype"
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    ) : (
                        <div className="mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded">
                            {watch('archetype') || '—'}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-white">Background</label>
                    <Editor
                        value={bg}
                        onChange={(html) => setValue('background', html)}
                    />
                </div>
                <div>
                    <label className="block text-sm text-white">Faction Objective</label>
                    <Editor
                        value={factionObj}
                        onChange={(html) => setValue('factionObjective', html)}
                    />
                </div>
            </div>

            <div className="flex space-x-4 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isEdit ? 'Update' : 'Create'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-500 text-gray-300 rounded hover:border-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

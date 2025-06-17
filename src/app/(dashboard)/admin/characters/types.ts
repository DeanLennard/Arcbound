// src/app/(dashboard)/admin/characters/types.ts
export interface CharacterSummary {
    _id: string
    charName: string
    status: 'Active' | 'Dead' | 'Retired'
    faction: string
    role: string
    race: string
    archetype: string
    user?: {
        _id: string
        playerName: string
    }
    arcship?: {
        _id: string
        name: string
    }
}

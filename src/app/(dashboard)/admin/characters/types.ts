// src/app/(dashboard)/admin/characters/types.ts
export interface CharacterSummary {
    _id: string
    charName: string
    status: 'Active' | 'Dead' | 'Retired' | 'NPC'
    faction: string
    role: string
    race: string
    archetype: string
    npc: boolean
    user?: {
        _id: string
        playerName: string
    }
    arcship?: {
        _id: string
        name: string
    }
}

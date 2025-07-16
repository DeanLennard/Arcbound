// src/models/DiplomacticState.ts
import mongoose, { Document } from 'mongoose'

export type FactionName =
    | 'The Virean Ascendancy'
    | 'The Aeon Collective'
    | 'The Sundered Concord'
    | 'The Helion Federation'
    | 'The Korveth Dominion'
    | 'The Tyr Solaris Imperium'
    | 'The Hollow Pact'
    | 'The Threadkeepers of Luvenn'
    | 'The Second Spiral'
    | 'House Ziralex'
    | 'The Ninefold Choir'
    | 'The Unmade'

export type Stance = 'Allied' | 'Friendly' | 'Neutral' | 'Strained' | 'Hostile' | 'WAR'

// one document per (phase, source→target) pair
export interface DiplomaticStateDoc extends Document {
    phase:    number
    source:   FactionName
    target:   FactionName
    stance:   Stance
    progress: number     // 0–100 towards next stance
}

const DiplomaticStateSchema = new mongoose.Schema<DiplomaticStateDoc>({
    phase:    { type: Number, required: true, index: true },
    source:   { type: String, enum: [
            'The Virean Ascendancy', 'The Aeon Collective', 'The Sundered Concord', 'The Helion Federation', 'The Korveth Dominion', 'The Tyr Solaris Imperium',
            'The Hollow Pact', 'The Threadkeepers of Luvenn', 'The Second Spiral', 'House Ziralex', 'The Ninefold Choir', 'The Unmade'
        ], required: true },
    target:   { type: String, enum: [
            'The Virean Ascendancy', 'The Aeon Collective', 'The Sundered Concord', 'The Helion Federation', 'The Korveth Dominion', 'The Tyr Solaris Imperium',
            'The Hollow Pact', 'The Threadkeepers of Luvenn', 'The Second Spiral', 'House Ziralex', 'The Ninefold Choir', 'The Unmade'
        ], required: true },
    stance:   { type: String, enum: ['Allied','Friendly','Neutral','Strained','Hostile', 'WAR'], required: true },
    progress: { type: Number, min: 0, max: 100, required: true },
}, { timestamps: true })

// enforce uniqueness: one direction per phase
DiplomaticStateSchema.index({ phase: 1, source: 1, target: 1 }, { unique: true })

export default mongoose.models.DiplomaticState ||
mongoose.model<DiplomaticStateDoc>('DiplomaticState', DiplomaticStateSchema)

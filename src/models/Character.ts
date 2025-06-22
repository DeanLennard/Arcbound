// src/models/Character.ts
import mongoose, { Document, Types } from 'mongoose';

export type CharacterStatus = 'Active' | 'Dead' | 'Retired';

export interface CharacterDocument extends Document {
    user: mongoose.Types.ObjectId;
    charName: string;
    status: CharacterStatus;
    faction: string;
    archetype: string;
    arcship?: Types.ObjectId;
    race: string;
    role: string;
    pictureUrl?: string;

    ascPoints: { spent: number; remaining: number };
    essenceBurn: { spent: number; remaining: number };
    credits: number;
    legacythreads: number;

    background: string;
    factionObjective: string;

    // relations
    items: Types.ObjectId[];
    shards: Types.ObjectId[];
    resistances: Types.ObjectId[];
    weaknesses: Types.ObjectId[];
    otherEffects: Types.ObjectId[];

    // role-specific
    implants: Types.ObjectId[];  // for Synths
    rituals: Types.ObjectId[];   // for Echo Weavers
    scrap: Types.ObjectId[]; // for Void Mechanics

    phases: Types.ObjectId[];

    createdAt: Date;
    updatedAt: Date;
}

const CharacterSchema = new mongoose.Schema<CharacterDocument>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    charName:    { type: String, required: true },
    status:      { type: String, enum: ['Active','Dead','Retired'], default: 'Active' },
    faction:     { type: String, required: true },
    archetype:   { type: String, required: true },

    arcship:     { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },

    race:        { type: String, required: true },
    role:        { type: String, required: true },
    pictureUrl:  { type: String },

    ascPoints: {
        spent:     { type: Number, default: 0 },
        remaining: { type: Number, default: 0 },
    },
    essenceBurn: {
        spent:     { type: Number, default: 0 },
        remaining: { type: Number, default: 0 },
    },
    credits:     { type: Number, default: 0 },
    legacythreads:     { type: Number, default: 0 },

    background:        { type: String, default: '' },
    factionObjective:  { type: String, default: '' },

    items:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    shards:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shard' }],
    resistances:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resistance' }],
    weaknesses:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Weakness' }],
    otherEffects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OtherEffect' }],

    implants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Implant' }],
    rituals:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ritual' }],
    scrap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scrap' }],

    phases:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Phase' }],
}, { timestamps: true });

export default mongoose.models.Character || mongoose.model<CharacterDocument>('Character', CharacterSchema);

// src/models/Effect.ts
import mongoose, { Document, Types } from 'mongoose';

export type EffectKind = 'Positive'|'Neutral'|'Negative';
export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
export type ChargeInterval = 'NONE' | 'PHASE' | 'GAME';

export interface EffectDoc extends Document {
    _id: Types.ObjectId | string;
    name: string;
    description: string;
    kind: EffectKind;
    level: PowerLevel;
    // now an array
    ships: Types.ObjectId[];
    charges?: number;
    maxCharges?: number;
    chargeInterval?: ChargeInterval;
}

const EffectSchema = new mongoose.Schema<EffectDoc>({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    kind:        { type: String, enum: ['Positive','Neutral','Negative'], default: 'Neutral' },
    level:        { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    ships:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' }],
    charges:        { type: Number, default: 0 },
    maxCharges:     { type: Number, default: 0 },
    chargeInterval: { type: String, enum: ['NONE','PHASE','GAME'], default: 'NONE' }
}, { timestamps: true });

export default mongoose.models.Effect || mongoose.model<EffectDoc>('Effect', EffectSchema);

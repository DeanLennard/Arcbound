// src/models/Effect.ts
import mongoose, { Document, Types } from 'mongoose';

export type EffectKind = 'Positive'|'Neutral'|'Negative';
export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';

export interface EffectDoc extends Document {
    name: string;
    description: string;
    kind: EffectKind;
    level: PowerLevel;
    // now an array
    ships: Types.ObjectId[];
}

const EffectSchema = new mongoose.Schema<EffectDoc>({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    kind:        { type: String, enum: ['Positive','Neutral','Negative'], default: 'Neutral' },
    level:        { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    ships:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' }],
}, { timestamps: true });

export default mongoose.models.Effect || mongoose.model<EffectDoc>('Effect', EffectSchema);

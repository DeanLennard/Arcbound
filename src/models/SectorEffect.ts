// src/models/SectorEffect.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface SectorEffectDoc extends Document {
    name: string;
    description: string;
    kind: 'Positive' | 'Neutral' | 'Negative';
    level: 'SPARK' | 'SURGE' | 'FLUX' | 'BREAK' | 'ASCENDANCE';
    sectors: Types.ObjectId[];   // sectors this effect applies to
}

const SectorEffectSchema = new Schema<SectorEffectDoc>({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    kind: { type: String, enum: ['Positive','Neutral','Negative'], required: true },
    level: {
        type: String,
        enum: ['SPARK','SURGE','FLUX','BREAK','ASCENDANCE'],
        required: true
    },
    sectors: [{ type: Schema.Types.ObjectId, ref: 'Sector' }]
}, { timestamps: true });

export const SectorEffect: Model<SectorEffectDoc> =
    mongoose.models.SectorEffect ||
    mongoose.model('SectorEffect', SectorEffectSchema);

export default SectorEffect;

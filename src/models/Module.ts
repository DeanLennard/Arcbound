// src/models/Module.ts
import mongoose, { Document, Types } from 'mongoose';

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
export type ChargeInterval = 'NONE' | 'PHASE' | 'GAME';

export interface ModuleDoc extends Document {
    name: string;
    description: string;
    state: 'Active' | 'Inactive';
    level: PowerLevel;
    attachedTo?: Types.ObjectId; // Arcship
    charges?: number | null;
    maxCharges?: number | null;
    chargeInterval?: ChargeInterval;
}

const ModuleSchema = new mongoose.Schema<ModuleDoc>({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    state:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
    level:        { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    attachedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
    charges:        { type: Number, default: null },
    maxCharges:     { type: Number, default: null },
    chargeInterval: { type: String, enum: ['NONE','PHASE','GAME'], default: 'NONE' },
});

export default mongoose.models.Module || mongoose.model<ModuleDoc>('Module', ModuleSchema);

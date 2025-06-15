// src/models/Module.ts
import mongoose, { Document, Types } from 'mongoose';

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';

export interface ModuleDoc extends Document {
    name: string;
    description: string;
    state: 'Active' | 'Inactive';
    level: PowerLevel;
    attachedTo?: Types.ObjectId; // Arcship
}

const ModuleSchema = new mongoose.Schema<ModuleDoc>({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    state:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
    level:        { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    attachedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
});

export default mongoose.models.Module || mongoose.model<ModuleDoc>('Module', ModuleSchema);

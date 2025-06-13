// Module.ts
import mongoose, { Document } from 'mongoose';
export interface ModuleDoc extends Document {
    name: string;
    description: string;
    cost: {
        credits: number;
        alloys:   number;
        energy:   number;
        data:     number;
        essence:  number;
    };
    prereqs: {
        cmdTotal?:  number;
        coreTotal?: number;
    };
    attachedTo?: mongoose.Types.ObjectId; // Arcship
}
const ModuleSchema = new mongoose.Schema<ModuleDoc>({
    name:        String,
    description: String,
    cost: {
        credits: Number, alloys: Number, energy: Number, data: Number, essence: Number
    },
    prereqs: {
        cmdTotal:  Number,
        coreTotal: Number
    },
    attachedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
});
export default mongoose.models.Module || mongoose.model<ModuleDoc>('Module', ModuleSchema);

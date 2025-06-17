// src/models/Phase.ts
import mongoose, { Document } from 'mongoose';
export interface PhaseDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const PhaseSchema = new mongoose.Schema<PhaseDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Phase || mongoose.model<PhaseDoc>('Phase', PhaseSchema);

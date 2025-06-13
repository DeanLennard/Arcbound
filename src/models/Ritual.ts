// src/models/Ritual.ts
import mongoose, { Document } from 'mongoose';
export interface RitualDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const RitualSchema = new mongoose.Schema<RitualDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Ritual || mongoose.model<RitualDoc>('Ritual', RitualSchema);

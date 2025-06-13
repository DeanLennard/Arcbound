// src/models/Weakness.ts
import mongoose, { Document } from 'mongoose';
export interface WeaknessDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const WeaknessSchema = new mongoose.Schema<WeaknessDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Weakness || mongoose.model<WeaknessDoc>('Weakness', WeaknessSchema);

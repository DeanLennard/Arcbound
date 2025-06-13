// src/models/OtherEffect.ts
import mongoose, { Document } from 'mongoose';
export interface OtherEffectDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const OtherEffectSchema = new mongoose.Schema<OtherEffectDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.OtherEffect || mongoose.model<OtherEffectDoc>('OtherEffect', OtherEffectSchema);

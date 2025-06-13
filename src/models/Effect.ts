// Effect.ts
import mongoose, { Document } from 'mongoose';
export type EffectKind = 'Positive'|'Neutral'|'Negative';
export interface EffectDoc extends Document {
    name: string;
    description: string;
    kind: EffectKind;
    ship: mongoose.Types.ObjectId;
}
const EffectSchema = new mongoose.Schema<EffectDoc>({
    name:        String,
    description: String,
    kind:        { type: String, enum: ['Positive','Neutral','Negative'] },
    ship:        { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
});
export default mongoose.models.Effect || mongoose.model<EffectDoc>('Effect', EffectSchema);

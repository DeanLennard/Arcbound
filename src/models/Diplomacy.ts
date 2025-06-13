// Diplomacy.ts
import mongoose, { Document } from 'mongoose';
export type DiplomacyType = 'Trade'|'NonAggression'|'Alliance'|'War'|'Annihilation'|'VassalSubject'|'VassalOverlord';
export interface DiplomacyDoc extends Document {
    arcship:     mongoose.Types.ObjectId;
    targetShip:  mongoose.Types.ObjectId;
    type:        DiplomacyType;
}
const DiplomacySchema = new mongoose.Schema<DiplomacyDoc>({
    arcship:    { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
    targetShip: { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
    type:       { type: String, enum: ['Trade','NonAggression','Alliance','War','Annihilation','VassalSubject','VassalOverlord'] },
});
export default mongoose.models.Diplomacy || mongoose.model<DiplomacyDoc>('Diplomacy', DiplomacySchema);

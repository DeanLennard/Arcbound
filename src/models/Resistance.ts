// src/models/Resistance.ts
import mongoose, { Document } from 'mongoose';
export interface ResistanceDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const ResistanceSchema = new mongoose.Schema<ResistanceDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Resistance || mongoose.model<ResistanceDoc>('Resistance', ResistanceSchema);

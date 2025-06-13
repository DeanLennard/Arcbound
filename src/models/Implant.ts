// src/models/Implant.ts
import mongoose, { Document } from 'mongoose';
export interface ImplantDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const ImplantSchema = new mongoose.Schema<ImplantDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Implant || mongoose.model<ImplantDoc>('Implant', ImplantSchema);

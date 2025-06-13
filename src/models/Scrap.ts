// src/models/Scrap.ts
import mongoose, { Document } from 'mongoose';
export interface ScrapDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const ScrapSchema = new mongoose.Schema<ScrapDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Scrap || mongoose.model<ScrapDoc>('Scrap', ScrapSchema);

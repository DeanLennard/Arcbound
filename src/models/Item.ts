// src/models/Item.ts
import mongoose, { Document } from 'mongoose';
export interface ItemDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const ItemSchema = new mongoose.Schema<ItemDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Item || mongoose.model<ItemDoc>('Item', ItemSchema);

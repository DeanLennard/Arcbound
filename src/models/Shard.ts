// src/models/Shard.ts
import mongoose, { Document } from 'mongoose';
export interface ShardDoc extends Document {
    number:      number;
    interaction: string;
    gambit:      string;
    resolution:  string;
    character:   mongoose.Types.ObjectId;
}
const ShardSchema = new mongoose.Schema<ShardDoc>({
    number:      Number,
    interaction: String,
    gambit:      String,
    resolution:  String,
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
}, { timestamps: true });
export default mongoose.models.Shard || mongoose.model<ShardDoc>('Shard', ShardSchema);

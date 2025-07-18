// src/models/Category.ts
import mongoose, { Document } from 'mongoose';

export interface CategoryDocument extends Document {
    name: string;
    image?: string;
    faction?: string;
}

const CategorySchema = new mongoose.Schema<CategoryDocument>({
    name: { type: String, required: true, unique: true },
    image: { type: String },
    faction: { type: String, required: false },
});

export default mongoose.models.Category || mongoose.model<CategoryDocument>('Category', CategorySchema);

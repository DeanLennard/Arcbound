// src/models/Category.ts
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String } // stores URL to image
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);

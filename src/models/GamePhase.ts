// src/models/GamePhase.ts
import mongoose, { Document } from 'mongoose';

export interface GamePhaseDoc extends Document {
    name:   string;
    phase:  number;
    isOpen: boolean;
}

const GamePhaseSchema = new mongoose.Schema<GamePhaseDoc>({
    name:   { type: String, required: true },
    phase:   { type: Number, required: true },
    isOpen: { type: Boolean, default: true },
}, { collection: 'gamePhase' });

export default mongoose.models.GamePhase ||
mongoose.model<GamePhaseDoc>('GamePhase', GamePhaseSchema);

// src/models/Sector.ts
import mongoose, {Document, Model, Types} from 'mongoose';

export type ControlStatus = string; // you can tighten this to an enum if you like

export interface SectorDoc extends Document {
    _id: string;
    name: string;
    x: number;
    y: number;
    control: ControlStatus;
    hasMission: boolean;
    effects: Types.ObjectId[];
}

const SectorSchema = new mongoose.Schema<SectorDoc>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
    control: {
        type: String,
        required: true,
        default: 'Uncontested',
        trim: true,
    },
    hasMission: {
        type: Boolean,
        required: true,
        default: false
    },
    effects: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Effect', default: [] }
    ],
}, {
    timestamps: true,
});

// If you ever want to restrict `control` to a set of factions:
// const ALLOWED = ['FactionA','FactionB','Neutral','Uncontested'];
// control: { type: String, enum: ALLOWED, default: 'Uncontested' }

export const Sector: Model<SectorDoc> =
    mongoose.models.Sector ||
    mongoose.model<SectorDoc>('Sector', SectorSchema);

export default Sector;

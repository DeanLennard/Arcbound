// models/Diplomacy.ts
import mongoose, { Document } from 'mongoose'

export type DiplomacyType =
    | 'Trade Agreement'
    | 'Non Aggression Pact'
    | 'Alliance'
    | 'War'
    | 'Total Annihilation'
    | 'Vassal'

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';

export interface DiplomacyDoc extends Document {
    name: string
    description: string
    type: DiplomacyType
    level: PowerLevel;
    ships: mongoose.Types.ObjectId[]  // ← all ships in this arrangement
}

const DiplomacySchema = new mongoose.Schema<DiplomacyDoc>({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    type:       { type: String, enum: ['Trade Agreement','Non Aggression Pact','Alliance','War','Total Annihilation','Vassal'] },
    level:        { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    ships:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' }],
})

export default mongoose.models.Diplomacy ||
mongoose.model<DiplomacyDoc>('Diplomacy', DiplomacySchema)

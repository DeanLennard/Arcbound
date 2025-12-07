// src/models/CharacterAsset.ts
import mongoose, { Document, Types } from 'mongoose';

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';
export type AssetCategory =
    | 'Tag'
    | 'Item'
    | 'Shard'
    | 'Resistance'
    | 'Weakness'
    | 'OtherEffect'
    | 'ThreatLedger'
    | 'Implant'
    | 'ThresholdForm'
    | 'GenomeThread'
    | 'VitalSignature'
    | 'Ritual'
    | 'Scrapcode';

export interface CharacterAssetDoc extends Document {
    name:        string;
    description: string;
    state:       'Active' | 'Inactive';
    level:       PowerLevel;
    category:    AssetCategory;
    apcost:      number;
    ebcost:      number;
    buildType:  'ITEM' | 'IMPLANT';
    buildCredits:  number;
    buildAlloys:  number;
    buildEnergy:  number;
    buildData:  number;
    buildEssence:  number;
    charges?: number;
    chargeInterval?: 'NONE' | 'PHASE' | 'GAME';
    currentCharges?: number
    character:   Types.ObjectId;
}

const CharacterAssetSchema = new mongoose.Schema<CharacterAssetDoc>({
    name:        { type: String, required: true },
    description: { type: String },
    state:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
    level:       { type: String, enum: ['SPARK','SURGE','FLUX','BREAK','ASCENDANCE'], default: 'SPARK' },
    apcost: { type: Number, default: 0 },
    ebcost: { type: Number, default: 0 },
    buildType:  { type: String, enum: ['ITEM', 'IMPLANT'], default: 'ITEM' },
    buildCredits: { type: Number, default: 0 },
    buildAlloys: { type: Number, default: 0 },
    buildEnergy: { type: Number, default: 0 },
    buildData: { type: Number, default: 0 },
    buildEssence: { type: Number, default: 0 },
    category:    { type: String, enum: [
            'Tag','Item','Shard','Resistance','Weakness','OtherEffect',
            'ThreatLedger','Implant','ThresholdForm','GenomeThread','VitalSignature',
            'Ritual','Scrapcode'
        ], required: true },
    charges: { type: Number, default: null },
    chargeInterval: {
        type: String,
        enum: ['NONE', 'PHASE', 'GAME'],
        default: 'NONE'
    },
    currentCharges: { type: Number, default: null },
    character:   { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
}, { timestamps: true });

export default mongoose.models.CharacterAsset ||
mongoose.model<CharacterAssetDoc>('CharacterAsset', CharacterAssetSchema);

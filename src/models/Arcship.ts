// src/models/Arcship.ts
import mongoose, { Document, Types } from 'mongoose';

export interface CoreMetric {
    base: number;
    mod: number;
}

export interface ArcshipDocument extends Document {
    name: string;
    faction: string;
    currentSector: string;
    benefit: string;
    challenge: string;

    hull: CoreMetric;
    core: CoreMetric;
    cmd: CoreMetric;
    crew: CoreMetric;
    nav: CoreMetric;
    sense: CoreMetric;
    intc: CoreMetric;

    // Resource balances:
    alloysBalance:   number;
    energyBalance:   number;
    dataBalance:     number;
    essenceBalance:  number;
    creditsBalance:  number;

    history: string;

    // relations
    modules: Types.ObjectId[];       // Module refs
    diplomacy: Types.ObjectId[];     // Diplomacy refs
    activeEffects: Types.ObjectId[]; // Effect refs
    eventLog: Types.ObjectId[];      // EventLog refs

    createdAt: Date;
    updatedAt: Date;
}

const CoreMetricSchema = new mongoose.Schema<CoreMetric>({
    base: { type: Number, default: 0 },
    mod:  { type: Number, default: 0 },
}, { _id: false });

const ArcshipSchema = new mongoose.Schema<ArcshipDocument>({
    name:          { type: String, required: true },
    faction:       { type: String, required: true },
    currentSector: { type: String, required: true },
    benefit:       { type: String, default: '' },
    challenge:     { type: String, default: '' },

    hull:   { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    core:   { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    cmd:    { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    crew:   { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    nav:    { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    sense:  { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },
    intc:   { type: CoreMetricSchema, required: true, default: { base: 0, mod: 0 } },

    // Persisted resource balances:
    alloysBalance:  { type: Number, required: true, default: 0 },
    energyBalance:  { type: Number, required: true, default: 0 },
    dataBalance:    { type: Number, required: true, default: 0 },
    essenceBalance: { type: Number, required: true, default: 0 },
    creditsBalance: { type: Number, required: true, default: 0 },

    history: { type: String, default: '' },

    modules:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    diplomacy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Diplomacy' }],
    activeEffects:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Effect' }],
    eventLog:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventLog' }],

}, { timestamps: true });

ArcshipSchema.pre<ArcshipDocument>('save', function (next) {
    // only on initial creation
    if (this.isNew) {
        const hullTotal  = this.hull.base  + this.hull.mod;
        const coreTotal  = this.core.base  + this.core.mod;
        const senseTotal = this.sense.base + this.sense.mod;
        const crewTotal  = this.crew.base  + this.crew.mod;

        this.alloysBalance   = hullTotal  * 3000;
        this.energyBalance   = coreTotal  * 3000;
        this.dataBalance     = senseTotal * 3000;
        this.essenceBalance  = crewTotal  * 1000;
        this.creditsBalance  = crewTotal  * 1000;
    }
    next();
});

// **VIRTUALS**
// Reverse‐populate all Characters whose .arcship === this._id
ArcshipSchema.virtual('commanders', {
    ref: 'Character',
    localField: '_id',
    foreignField: 'arcship',
});

// Reverse‐populate retired/died prevCommanders if you track status
ArcshipSchema.virtual('prevCommanders', {
    ref: 'Character',
    localField: '_id',
    foreignField: 'arcship',
    // add match: { status: 'Dead' } if you only want dead ones
});

// ensure virtuals show up
ArcshipSchema.set('toObject', { virtuals: true });
ArcshipSchema.set('toJSON',   { virtuals: true });

export default mongoose.models.Arcship || mongoose.model<ArcshipDocument>('Arcship', ArcshipSchema);

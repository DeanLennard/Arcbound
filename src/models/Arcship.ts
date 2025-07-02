// src/models/Arcship.ts
import mongoose, { Document, Types } from 'mongoose';

export interface CoreMetric {
    base: number;
    mod: number;
}

export interface ArcshipDocument extends Document {
    name: string;
    faction: string;
    currentSector: Types.ObjectId
    xSector: number;
    ySector: number;
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

    offensiveMod:           number;
    defensiveMod:           number;
    tacticalMod:            number;
    movementInteractionMod: number;
    movementResolutionMod:  number;
    targetRangeMod:         number;
    shippingItemsMod:       number;
    moduleSlotsMod:         number;

    // relations
    modules:       Types.ObjectId[]; // ← Module.attachedTo
    effects:       Types.ObjectId[]; // ← Effect.ships
    diplomacy:     Types.ObjectId[]; // ← Diplomacy.ships
    eventLog: Types.ObjectId[];      // EventLog refs

    flagUrl?: string;

    isCloaked: boolean;

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
    currentSector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sector',
        required: true
    },
    xSector:       { type: Number, default: 0 },
    ySector:       { type: Number, default: 0 },
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

    offensiveMod:           { type: Number, default: 0 },
    defensiveMod:           { type: Number, default: 0 },
    tacticalMod:            { type: Number, default: 0 },
    movementInteractionMod: { type: Number, default: 0 },
    movementResolutionMod:  { type: Number, default: 0 },
    targetRangeMod:         { type: Number, default: 0 },
    shippingItemsMod:       { type: Number, default: 0 },
    moduleSlotsMod:         { type: Number, default: 0 },

    flagUrl: { type: String, default: '' },

    isCloaked: { type: Boolean, default: false },

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
// 1) Modules attachedTo this arcship
ArcshipSchema.virtual('modules', {
    ref:         'Module',
    localField:  '_id',
    foreignField:'attachedTo',
});

// 2) Effects whose ships[] array includes this arcship
ArcshipSchema.virtual('effects', {
    ref:         'Effect',
    localField:  '_id',
    foreignField:'ships',
});

// 3) Diplomacy docs whose ships[] array includes this arcship
ArcshipSchema.virtual('diplomacy', {
    ref:         'Diplomacy',
    localField:  '_id',
    foreignField:'ships',
});

// 4) Your existing commander & prevCommander reverse populates
ArcshipSchema.virtual('commanders', {
    ref:         'Character',
    localField:  '_id',
    foreignField:'arcship',
});
ArcshipSchema.virtual('prevCommanders', {
    ref:         'Character',
    localField:  '_id',
    foreignField:'arcship',
    // you could add match: { status: 'Dead' }, if desired
});

// 5) Event log
ArcshipSchema.virtual('eventLog', {
    ref:         'EventLog',
    localField:  '_id',
    foreignField:'arcship',
});

// ensure virtuals show up
ArcshipSchema.set('toObject', { virtuals: true });
ArcshipSchema.set('toJSON',   { virtuals: true });

export default mongoose.models.Arcship || mongoose.model<ArcshipDocument>('Arcship', ArcshipSchema);

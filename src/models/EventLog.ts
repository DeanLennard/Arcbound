// EventLog.ts
import mongoose, { Document } from 'mongoose';

export type PowerLevel = 'SPARK'|'SURGE'|'FLUX'|'BREAK'|'ASCENDANCE';

export interface EventLogDoc extends Document {
    eventName:  string;
    effect:     string;
    phase:      string;
    level: PowerLevel;
    ongoing:    boolean;
    arcship:    mongoose.Types.ObjectId;
    createdAt:     Date;
}
const EventLogSchema = new mongoose.Schema<EventLogDoc>({
    eventName:  String,
    effect:     String,
    phase:      String,
    level: { type: String, enum: ['SPARK','SURGE','FLUX', 'BREAK', 'ASCENDANCE'], default: 'SPARK' },
    ongoing:    Boolean,
    arcship:    { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
}, { timestamps: true });

export default mongoose.models.EventLog || mongoose.model<EventLogDoc>('EventLog', EventLogSchema);

// EventLog.ts
import mongoose, { Document } from 'mongoose';
export interface EventLogDoc extends Document {
    eventName:  string;
    effect:     string;
    phase:      string;
    powerLevel: number;
    ongoing:    boolean;
    arcship:    mongoose.Types.ObjectId;
}
const EventLogSchema = new mongoose.Schema<EventLogDoc>({
    eventName:  String,
    effect:     String,
    phase:      String,
    powerLevel: Number,
    ongoing:    Boolean,
    arcship:    { type: mongoose.Schema.Types.ObjectId, ref: 'Arcship' },
});
export default mongoose.models.EventLog || mongoose.model<EventLogDoc>('EventLog', EventLogSchema);

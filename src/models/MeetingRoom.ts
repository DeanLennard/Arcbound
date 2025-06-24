// src/models/MeetingRoom.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IMeetingRoom extends Document {
    name: string;
    hostId: mongoose.Types.ObjectId;
    coHostIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    isLocked: boolean;
    allowGuests: boolean;
    settings: {
        enableBreakouts: boolean;
        enableRecording: boolean;
        enablePolls: boolean;
        enableQA: boolean;
    };
    scheduledStart?: Date;
    durationMinutes?: number;
    participantCount: number;
}

const MeetingRoomSchema = new Schema<IMeetingRoom>({
    name:           { type: String, required: true },
    hostId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coHostIds:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt:      { type: Date, default: Date.now },
    isLocked:       { type: Boolean, default: false },
    allowGuests:    { type: Boolean, default: true },
    settings: {
        enableBreakouts: { type: Boolean, default: true },
        enableRecording: { type: Boolean, default: false },
        enablePolls:     { type: Boolean, default: true },
        enableQA:        { type: Boolean, default: true },
    },
    scheduledStart:  { type: Date },         // optional, ISO date
    durationMinutes: { type: Number, default: 60 },
    participantCount: { type: Number, default: 0 },
});

// Guard against OverwriteModelError in dev
const MeetingRoom: Model<IMeetingRoom> =
    mongoose.models.MeetingRoom ||
    mongoose.model<IMeetingRoom>('MeetingRoom', MeetingRoomSchema);

export default MeetingRoom;

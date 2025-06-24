// src/models/MeetingMessage.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IMeetingMessage extends Document {
    roomId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    type: 'chat' | 'reaction' | 'system';
    payload: any;
    timestamp: Date;
}

const MeetingMessageSchema = new Schema<IMeetingMessage>({
    roomId:    { type: Schema.Types.ObjectId, ref: 'MeetingRoom', required: true },
    senderId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, enum: ['chat','reaction','system'], default: 'chat' },
    payload:   { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
});

// Guard against OverwriteModelError in dev
const MeetingMessage: Model<IMeetingMessage> =
    mongoose.models.MeetingMessage ||
    mongoose.model<IMeetingMessage>('MeetingMessage', MeetingMessageSchema);

export default MeetingMessage;

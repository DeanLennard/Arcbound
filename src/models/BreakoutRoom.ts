// models/BreakoutRoom.ts
import mongoose, { Schema, Types, Model, Document } from 'mongoose';

interface IBreakoutRoom extends Document {
    meetingId: mongoose.Types.ObjectId;
    name: string;
    participantIds: mongoose.Types.ObjectId[];
}

const BreakoutRoomSchema = new Schema<IBreakoutRoom>({
    meetingId:      { type: Schema.Types.ObjectId, ref: 'MeetingRoom', required: true },
    name:           { type: String, required: true },
    participantIds: [{ type: Types.ObjectId, ref: 'User' }],
});

const BreakoutRoom: Model<IBreakoutRoom> =
    mongoose.models.BreakoutRoom ||
    mongoose.model<IBreakoutRoom>('BreakoutRoom', BreakoutRoomSchema);

export default BreakoutRoom;

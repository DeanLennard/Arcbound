// models/Poll.ts
import mongoose, { Schema, Types, Model, Document } from 'mongoose';

interface IPollOption { text: string; voteCount: number; }
interface IPoll extends Document {
    roomId: mongoose.Types.ObjectId;
    question: string;
    options: IPollOption[];
    isOpen: boolean;
    createdAt: Date;
}

const PollSchema = new Schema<IPoll>({
    roomId:    { type: Schema.Types.ObjectId, ref: 'MeetingRoom', required: true },
    question:  { type: String, required: true },
    options:   [{ text: String, voteCount: { type: Number, default: 0 } }],
    isOpen:    { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const Poll: Model<IPoll> =
    mongoose.models.Poll ||
    mongoose.model<IPoll>('Poll', PollSchema);

export default Poll;

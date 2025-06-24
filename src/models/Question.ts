// models/Question.ts
import mongoose, { Schema, Types, Model, Document } from 'mongoose';

interface IQuestion extends Document {
    roomId: mongoose.Types.ObjectId;
    askerId: mongoose.Types.ObjectId;
    text: string;
    isAnswered: boolean;
    createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
    roomId:     { type: Schema.Types.ObjectId, ref: 'MeetingRoom', required: true },
    askerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:       { type: String, required: true },
    isAnswered: { type: Boolean, default: false },
    createdAt:  { type: Date, default: Date.now },
});

const Question: Model<IQuestion> =
    mongoose.models.Question ||
    mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;

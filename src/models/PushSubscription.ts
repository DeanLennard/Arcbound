// src/models/PushSubscription.ts
import mongoose, { Document } from 'mongoose';

export interface PushSubscriptionDocument extends Document {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
}

const PushSubscriptionSchema = new mongoose.Schema({
    endpoint: String,
    keys: {
        p256dh: String,
        auth: String,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.PushSubscription ||
mongoose.model<PushSubscriptionDocument>('PushSubscription', PushSubscriptionSchema);

import { model, models, Schema, type Model, type Types } from 'mongoose';

export interface FeedbackDocument {
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
    tags: string[];
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
        tags: { type: [String], required: true, default: [] },
        message: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

export const Feedback: Model<FeedbackDocument> = models.Feedback
    ? model<FeedbackDocument>('Feedback')
    : model<FeedbackDocument>('Feedback', feedbackSchema);

export default Feedback;
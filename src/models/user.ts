import { model, models, Schema, type Model } from 'mongoose';

export interface UserDocument {
    clerkId: string;
    email: string;
    name: string;
    credits: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        credits: {
            type: Number,
            required: true,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

export const User: Model<UserDocument> = models.User
    ? model<UserDocument>('User')
    : model<UserDocument>('User', userSchema);

export default User;

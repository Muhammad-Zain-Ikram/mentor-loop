import { model, models, Schema, type Model } from 'mongoose';

export interface UserDocument {
    clerkId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: 'member' | 'admin';
    credits: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    credits: {
      type: Number,
      required: true,
      default: 1,
      min: 0
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export const User: Model<UserDocument> = models.User
    ? model<UserDocument>('User')
    : model<UserDocument>('User', userSchema);

export default User;
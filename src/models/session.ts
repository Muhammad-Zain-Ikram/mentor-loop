import { model, models, Schema, type Model, type Types } from 'mongoose';

export interface Objective {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
}

export type ChatRole = 'user' | 'billy';

export interface ChatHistoryEntry {
    role: ChatRole;
    content: string;
    timestamp: Date;
}

export type SessionStatus = 'active' | 'completed';
export type SessionReport = {
    summary: string;
    gaps: string[];
    insights: string;
};
export interface SessionDocument {
    userId: Types.ObjectId;
    topic: string;
    objectives: Objective[];
    chatHistory: ChatHistoryEntry[];
    billyUnderstanding: number;
    status: SessionStatus;
    report: SessionReport | null;
    createdAt: Date;
    updatedAt: Date;
}

const objectiveSchema = new Schema<Objective>(
    {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        isCompleted: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        _id: false
    }
);

const chatHistoryEntrySchema = new Schema<ChatHistoryEntry>(
    {
        role: {
            type: String,
            enum: ['user', 'billy'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            required: true
        }
    },
    {
        _id: false
    }
);

const reportSchema = new Schema<SessionReport>(
    {
        summary: {
            type: String,
            required: true
        },
        gaps: {
            type: [String],
            required: true
        },
        insights: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
);

const sessionSchema = new Schema<SessionDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        topic: {
            type: String,
            required: true
        },
        objectives: {
            type: [objectiveSchema],
            required: true,
            default: []
        },
        chatHistory: {
            type: [chatHistoryEntrySchema],
            required: true,
            default: []
        },
        billyUnderstanding: {
            type: Number,
            required: true,
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            required: true,
            default: 'active'
        },
        report: {
            type: reportSchema,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const Session: Model<SessionDocument> = models.Session
    ? model<SessionDocument>('Session')
    : model<SessionDocument>('Session', sessionSchema);

export default Session;

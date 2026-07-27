import { z } from 'zod';

export const TopicInputSchema = z
  .object({
    topic: z.string().min(2).max(100)
  })
  .strict();

export const CreateSessionInputSchema = z
  .object({
    topic: z.string().min(2).max(100),
    broadTopic: z.string().min(2).max(100)
  })
  .strict();

export const EvaluateInputSchema = z
  .object({
    userMessage: z.string().min(5).max(2000)
  })
  .strict();

export const SubtopicSchema = z
  .object({
    subtopics: z.array(z.string()).min(3).max(4).nullable()
  })
  .strict();

export const ObjectiveSchema = z
  .object({
    objectives: z
      .array(
        z
          .object({
            id: z.string().describe('kebab-case-id'),
            title: z.string(),
            description: z.string()
          })
          .strict()
      )
      .min(3)
      .max(4)
  });
export const EvaluationSchema = z
  .object({
    objective_met: z.boolean(),
    reasoning: z.string(),
    billy_reply: z.string()
  });
export const ReportSchema = z
  .object({
    summary: z.string(),
    gaps: z.array(z.string()),
    insights: z.string()
  });
  
export const FeedbackInputSchema = z.object({
  sessionId: z.string().length(24), // MongoDB ObjectId length
  tags: z.array(z.string()).min(1).max(3), // Let them pick 1 to 3 tags
  message: z.string().min(10).max(1000)
}).strict();

export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;
export type TopicInput = z.infer<typeof TopicInputSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
export type EvaluateInput = z.infer<typeof EvaluateInputSchema>;
export type SubtopicOutput = z.infer<typeof SubtopicSchema>;
export type ObjectiveOutput = z.infer<typeof ObjectiveSchema>;
export type EvaluationOutput = z.infer<typeof EvaluationSchema>;
export type ReportOutput = z.infer<typeof ReportSchema>;

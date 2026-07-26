import { z } from 'zod';

export const TopicInputSchema = z
  .object({
    topic: z.string().min(2).max(100)
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
  })
  .strict();

export const EvaluationSchema = z
  .object({
    objective_met: z.boolean(),
    reasoning: z.string(),
    billy_reply: z.string()
  })
  .strict();

export const ReportSchema = z
  .object({
    summary: z.string(),
    gaps: z.array(z.string()),
    insights: z.string()
  })
  .strict();

export type TopicInput = z.infer<typeof TopicInputSchema>;
export type EvaluateInput = z.infer<typeof EvaluateInputSchema>;
export type SubtopicOutput = z.infer<typeof SubtopicSchema>;
export type ObjectiveOutput = z.infer<typeof ObjectiveSchema>;
export type EvaluationOutput = z.infer<typeof EvaluationSchema>;
export type ReportOutput = z.infer<typeof ReportSchema>;

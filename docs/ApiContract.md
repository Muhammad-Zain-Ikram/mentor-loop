# MentorLoop — API Contract

All API routes are located in `src/app/api/`.

- **Response Format:** `NextResponse.json()`
- **Validation:** All request payloads and AI-generated responses are validated using **Zod**.
- **Standardized Error Format:** Every error response **must** follow this structure:

```ts
{
  error: {
    code: string;      // e.g. "INSUFFICIENT_CREDITS", "AI_CALL_FAILED", "UNAUTHORIZED"
    message: string;   // User-friendly message
  }
}
```

---

# 1. POST `/api/v1/sessions/prepare`

## Purpose

Determine whether the provided topic is too broad. If it is, generate a list of subtopics.

## Authentication

- ✅ Required (Clerk)

## Request Body

```ts
{
  topic: string;
}
```

## Process

1. Validate the request using Zod.
2. Call the AI using the `SubtopicSchema`.
3. If the topic is broad, return the generated subtopics.

## Response

```ts
{
  subtopics: string[] | null;
}
```

---

# 2. POST `/api/v1/sessions/create`

## Purpose

Create a new learning session, deduct one user credit, and generate learning objectives.

## Authentication

- ✅ Required (Clerk)

## Request Body

```ts
{
  topic: string;
}
```

## Process

1. Fetch the authenticated user.
2. Verify that `credits > 0`.
3. If credits are `0`, return **HTTP 402** with the error code `INSUFFICIENT_CREDITS`.
4. Deduct **1 credit**.
5. Call the AI using the `ObjectiveSchema`.
6. Create a new `Session` document in MongoDB.

## Response

```ts
{
  sessionId: string;
  objectives: Objective[];
}
```

---

# 3. GET `/api/v1/sessions/[sessionId]`

## Purpose

Retrieve the current session state and chat history.

## Authentication

- ✅ Required (Clerk)
- User must own the session.

## Process

1. Fetch the session using:
   - `_id`
   - `userId`
2. If the session does not exist or does not belong to the authenticated user, return **HTTP 404** with the error code `SESSION_NOT_FOUND`.

## Response

```ts
{
  session: SessionObject;
}
```

---

# 4. POST `/api/v1/sessions/[sessionId]/evaluate`

## Purpose

Evaluate the user's latest message against the next incomplete learning objective.

## Authentication

- ✅ Required (Clerk)
- User must own the session.

## Request Body

```ts
{
  userMessage: string;
}
```

## Process

1. Fetch the session.
2. Find the next incomplete objective.
3. Call the AI using the `EvaluationSchema`.
4. If AI validation fails (Zod), return **HTTP 500** with the error code `AI_PARSE_FAILED`.
5. If `objective_met === true`:
   - Mark the objective as completed.
6. Recalculate the learning progress:

```text
billyUnderstanding = (completedObjectives / totalObjectives) * 100
```

7. Save the updated session.
8. Append the following to `chatHistory`:
   - User message
   - Billy's AI reply

## Response

```ts
{
  billy_reply: string;
  billyUnderstanding: number;
  objectives: Objective[];
}
```

---

# 5. POST `/api/v1/sessions/[sessionId]/report`

## Purpose

Generate the final learning mastery report.

## Authentication

- ✅ Required (Clerk)
- User must own the session.

## Process

1. Fetch the session.
2. Call the AI to summarize:
   - Knowledge gaps
   - Learning insights
3. Update the session status to `completed`.

## Response

```ts
{
  summary: string;
  gaps: string[];
  insights: string;
}
```
# 5.1 GET `/api/v1/sessions/[sessionId]/report`

## Purpose

Fetch the previously generated mastery report from the database.

## Authentication

- ✅ Required (Clerk)
- User must own the session.

## Process

1. Fetch the session using:
   - `_id`
   - `userId`
2. Check whether `session.report` exists.
3. If the report does not exist, return **HTTP 404** with the error code `REPORT_NOT_GENERATED`.
4. If the report exists, return the stored report object.

## Response

```ts
{
  topic: string;
  summary: string;
  gaps: string[];
  insights: string;
}
```

---
---

# 6. GET `/api/v1/user`

## Purpose

Retrieve dashboard information for the authenticated user.

## Authentication

- ✅ Required (Clerk)

## Process

1. Fetch the user's remaining credits.
2. Fetch the user's latest **10 sessions**.

## Response

```ts
{
  credits: number;
  sessions: SessionMeta[];
}
```

---

# 7. POST `/api/webhooks/clerk`

## Purpose

Synchronize newly created Clerk users with MongoDB.

## Authentication

- Svix Signature Verification

## Process

1. Handle the `user.created` event.
2. Create a MongoDB user document with:

```ts
{
  clerkId: string;
  email: string;
  name: string;
  credits: 1;
}
```

3. Trigger the welcome email template located at:

```text
lib/emails/welcome.ts
```

4. Send the email using:

```text
lib/resend.ts
```

---

# 8. POST `/api/webhooks/lemonsqueezy`

## Purpose

Grant credits after a successful payment.

## Authentication

- HMAC SHA256 Signature Verification

## Process

1. Handle the `order_created` event.
2. Find the user by email.
3. Add **50 credits** to the user's account.
4. Trigger the payment success email template located at:

```text
lib/emails/payment-success.ts
```

5. Send the email using:

```text
lib/resend.ts
```

---
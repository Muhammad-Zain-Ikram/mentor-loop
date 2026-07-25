
# MentorLoop — Architecture & System Design

## 1. Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, React 19, TypeScript with `strict: true`) |
| **Styling** | Tailwind CSS (Always use design tokens from the global config. Never use raw hex colors or pixel values in components.) |
| **Authentication** | Clerk (Custom Auth UI, Google, GitHub, Email/Password, Clerk Webhooks for DB sync) |
| **Payments** | Lemon Squeezy (Redirect unauthenticated users to login before checkout) |
| **Emails** | Resend (Welcome emails, payment confirmations, spaced repetition reminders) |
| **Database** | MongoDB with Mongoose |
| **Code Quality** | ESLint + Prettier |
| **AI** | OpenAI-compatible endpoints (`gpt-4o-mini`, `gemini-1.5-flash`) |

---

## 2. Project Structure

```text
src/
├── app/
│   ├── (marketing)/                 # Public, SSR'd pages
│   │   ├── page.tsx                 # Landing page (/)
│   │   └── layout.tsx
│   │
│   ├── (auth)/                      # Custom Clerk Auth UI pages
│   │   ├── login/page.tsx           # Custom login UI using Clerk's <SignIn>
│   │   ├── signup/page.tsx          # Custom signup UI using Clerk's <SignUp>
│   │   └── layout.tsx
│   │
│   ├── (app)/                       # Protected application UI
│   │   ├── dashboard/page.tsx       # Home page after login (Start session button)
│   │   ├── teach/
│   │   │   └── [sessionId]/page.tsx # Teaching playground (Chat + Gauge)
│   │   └── layout.tsx               # App shell (Navbar with credits, logout)
│   │
│   ├── api/
│   │   ├── v1/                      # Versioned API Route Handlers
│   │   │   ├── sessions/
│   │   │   │   ├── prepare/route.ts
│   │   │   │   ├── create/route.ts
│   │   │   │   └── [sessionId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── evaluate/route.ts
│   │   │   │       └── report/route.ts
│   │   │   └── user/
│   │   │       └── route.ts
│   │   │
│   │   ├── cron/
│   │   │   └── spaced-repetition/
│   │   │       └── route.ts
│   │   │
│   │   └── webhooks/
│   │       ├── clerk/route.ts
│   │       └── lemonsqueezy/route.ts
│   │
│   ├── layout.tsx
│   └── middleware.ts
│
├── components/
│   ├── ui/
│   ├── landing/
│   ├── auth/
│   ├── dashboard/
│   ├── teach/
│   └── context/
│
├── lib/
│   ├── db.ts
│   ├── ai.ts
│   ├── schemas.ts
│   ├── prompts.ts
│   ├── clerk.ts
│   ├── lemonsqueezy.ts
│   ├── resend.ts
│   └── emails/
│       ├── welcome.ts
│       ├── payment-success.ts
│       └── billy-followup.ts
│
├── models/
│   ├── user.ts
│   └── session.ts
│
├── hooks/
│   ├── use-chat.ts
│   └── use-session.ts
│
└── types/
    └── index.ts
```

---

## 3. Core Workflow Overview

### 3.1 Topic Preparation & Session Creation

1. User enters a broad topic.
2. Backend calls the AI to generate relevant subtopics.
3. User selects a single subtopic.
4. Backend:
   - Generates strict learning objectives.
   - Saves the session to MongoDB.
   - Deducts **1 credit** from the user's account.

---

### 3.2 The Teaching Loop

1. User teaches Billy by explaining the concept in chat.
2. Backend fetches the next incomplete learning objective.
3. AI evaluates the user's explanation **only** against that objective.
4. If the objective is satisfied:
   - Update the objective in MongoDB.
   - Recalculate Billy's understanding gauge.
5. Billy responds with feedback or the next question.

---

### 3.3 Completion & Retention

When Billy's understanding gauge reaches **100%**:

1. Backend generates a mastery report containing:
   - Knowledge gaps
   - Learning insights
   - Session summary
2. Three days later:
   - A Vercel Cron job runs.
   - Resend sends a follow-up email.
   - Billy asks a refresher question to reinforce long-term retention through spaced repetition.


# MentorLoop — Product Overview

## Register

- **Brand:** MentorLoop
- **Platform:** Web (Next.js)
- **Tagline:** *Teach an AI junior developer. Discover what you actually understand.*

---

# Users & Target Audience

MentorLoop is built for:

- Self-taught developers who want to be job ready
- Coding bootcamp graduates who want to verify and they learn topic deeply
- Developers preparing for technical interviews

These users often suffer from the **illusion of competence** after passively consuming tutorials. They need a way to validate whether they truly understand technical concepts—such as Redis, Docker, JWT, or React Hooks—before applying them in projects or interviews.

---

# Product Purpose

MentorLoop allows learners to **teach** a simulated AI junior developer named **Billy**.

Instead of providing explanations, the platform requires users to articulate concepts in their own words. Billy intentionally misunderstands explanations and asks follow-up questions, forcing learners to refine their thinking.

The platform evaluates each explanation against predefined learning objectives and known misconceptions stored in the database. A lesson is only considered complete once the learner has demonstrated genuine understanding.

---

# Core Features (V1)

## 1. Topic Scoping

- User enters a broad topic (e.g. **JavaScript**)
- AI generates **3–4 focused subtopics**
  - Object-Oriented Programming
  - Async JavaScript
  - Closures
  - Event Loop
- User selects one subtopic.

---

## 2. Objective Generation

For the selected subtopic, AI generates **3–4 strict learning objectives**.

These objectives define exactly what must be demonstrated before mastery is awarded.

---

## 3. The Teaching Loop

The learner teaches Billy through a chat interface.

Billy behaves like a junior developer or intern:

- Attempts to apply the explanation
- Makes realistic mistakes
- Asks clarifying questions
- Forces the learner to explain concepts more precisely

The learner acts as the mentor—not the student.

---

## 4. Validation Engine

The backend evaluates every explanation using structured **Zod schemas**.

Validation determines whether the learner has:

- Covered required concepts
- Avoided common misconceptions
- Demonstrated sufficient understanding

The learner's mastery progress is updated in the database.

---

## 5. Mastery Report

Once all objectives reach **100% completion**, MentorLoop generates a shareable mastery report containing:

- Validated learning objectives
- Remaining conceptual gaps
- Key insights from the teaching session
- Evidence of demonstrated understanding

---

# Business Model

## Free Tier

- 3 learning credit
- Designed to deliver the initial "aha" moment

---

## Pro Tier ($5 one-time)

- 50 learning credits
- No subscriptions
- No recurring payments


---

# Positioning

Unlike AI tutors such as ChatGPT or Claude that explain concepts to learners, MentorLoop evaluates the learner's explanations.

Its purpose is to measure understanding rather than deliver information, leveraging the **Protégé Effect** to reinforce learning through teaching.

---

# Brand Personality

MentorLoop should feel:

- Intelligent
- Trustworthy
- Professional
- Focused
- Engineering-first

The landing experience should communicate:

- Measurable learning
- Clear progress
- Reliable feedback
- Confidence in the evaluation process

---

# Anti-References

Avoid visual patterns associated with:

- Generic AI chatbot interfaces
- Cluttered developer dashboards
- Academic LMS platforms
- Gamified learning apps (e.g. Duolingo)
- Cyberpunk AI aesthetics

Billy should **not** be presented as:

- A virtual assistant
- A tutor
- A game character

Also avoid:

- Decorative grids
- Heavy shadows
- Gradients
- Glassmorphism
- Bubble-style UI
- Visual noise

---

# Positive References

Design inspiration should come from products such as:

- Cursor
- Linear
- Raycast
- Vercel
- Notion

Key characteristics:

- Restrained visual design
- Excellent typography
- Strong hierarchy
- Fast interactions
- Developer-focused workflows
- High readability

---

# Design Principles

1. Make demonstrated understanding visible through objectives, and progress.
2. Ensure every interaction moves the learner closer to lesson completion.
3. Build trust with structured, evidence-based feedback instead of AI spectacle.
4. Position the learner as the mentor of a junior developer, not a student taking a quiz.
5. Keep the experience focused, legible, and fast to begin.

---

# Accessibility & Inclusion

MentorLoop should:

- Meet **WCAG AA** contrast requirements
- Support keyboard-first navigation
- Be compatible with screen readers
- Respect reduced-motion preferences
- Provide clear loading and progress feedback during asynchronous operations
# MentorLoop — Design System & UI Guide

---

# 1. Design Philosophy

**"Calm Tech, Professional Focus."**

The interface should feel like a premium developer tool, inspired by products such as **Linear**, **Cursor**, and **Vercel**.

Core characteristics:

- Professional
- Legible
- Restrained
- Purpose-driven
- Engineering-focused

Every interaction should reinforce confidence and clarity rather than entertainment.

---

# 2. Strict Anti-References

## Do **NOT** build any of the following:

### AI Chatbot Aesthetics

- Generic AI-chatbot interfaces
- Floating chat bubbles
- Cyberpunk themes
- Neon colors

### Complex Dashboards

- Grafana-style layouts
- Kibana-style complexity
- Dense analytics dashboards

### Gamified Learning

- Duolingo-style mascots
- Cartoon characters
- Achievement-heavy interfaces

### Visual Noise

Avoid:

- Decorative grids
- Heavy shadows
- Floating cards
- Gradients
- Glassmorphism
- Excessive visual effects

### Conversation Style

Do **not** design an open-ended chat application.

Every interaction should have a clear instructional purpose.

---

# 3. Design Tokens (Tailwind Config)

> **Rule:** Never use raw Tailwind utility colors (e.g. `text-green-500` or `bg-blue-600`).
>
> Always use semantic design tokens.

---

## Colors

```ts
colors: {
  primary: {
    50:  '#f0fdf4', // subtle background tint
    100: '#dcfce7', // badges
    600: '#16a34a', // primary actions, buttons, active states, gauge fill
    700: '#15803d', // hover states
    900: '#14532d'  // text on light backgrounds
  },

  surface: {
    DEFAULT: '#fafaf9', // page background (warm off-white)
    card:    '#ffffff', // cards, panels, chat containers
    muted:   '#f4f4f5'  // secondary surfaces
  },

  ink: {
    DEFAULT: '#18181b', // headings & primary text
    muted:   '#71717a', // body copy
    subtle:  '#a1a1aa'  // placeholders & disabled text
  },

  border: '#e4e4e7'
}
```

---

## Typography

### Display Font

Used for:

- Hero titles
- Section headings
- Major emphasis

```css
font-display font-bold tracking-tight
```

**Typeface:** Space Grotesk

---

### Body Font

Used for:

- Paragraphs
- Chat content
- General interface copy

```css
font-body
```

**Typeface:** Inter

---

### Monospace

Used for:

- Metadata
- Labels
- Terminal output
- Technical identifiers

```css
font-mono text-xs uppercase tracking-[0.18em] text-ink-muted
```

**Typeface:** JetBrains Mono

---

# 4. Component Generation Rules

## BillyGauge

**Location**

```text
components/teach/BillyGauge.tsx
```

### Critical Requirements

Do **not** build:

- Linear progress bars
- Circular progress indicators
- Loading spinners

### Specification

Build an **SVG semicircular gauge** (180° half-circle).

The gauge should include:

- Tick marks around the outer edge
- Gradient stroke using `primary-600`
- Spring-animated needle
- Needle points to the learner's current percentage

### Purpose

The gauge represents:

> **Demonstrated Understanding**

It is **not** a loading indicator.

---

## Layout & Cards

Structure should rely on clean borders instead of shadows.

### Borders

```css
border border-border
```

### Backgrounds

```css
bg-surface
```

### Reading Width

```css
max-w-6xl mx-auto
```

Avoid:

- Heavy drop shadows
- Floating card effects

---

## Buttons & Micro-Interactions

### Primary Button

```css
bg-primary-600 text-white hover:bg-primary-700 transition-all
```

### Cards

Use subtle interaction feedback.

```css
transition-colors hover:border-primary-200
```

Avoid dramatic hover animations or lifting effects.

---

# 5. Motion (Framer Motion)

Motion should communicate state changes—not decorate the interface.

## General Principles

- Use restrained animation
- No constant looping
- Respect reduced-motion preferences

---

## Entrance Animations

Hero content should use a staggered fade-in-up animation.

```tsx
initial={{ opacity: 0, y: 18 }}
animate={{ opacity: 1, y: 0 }}
```

---

## State Changes

### BillyGauge

- Spring physics for the needle
- Smooth, responsive transitions

### Chat

Messages should appear using:

- Height transitions
- Opacity transitions

The animation should support readability and maintain focus rather than draw attention.

---

# Design Summary

MentorLoop's UI should feel like a thoughtfully crafted engineering tool.

The design should prioritize:

- Demonstrated understanding over visual spectacle
- Clear hierarchy over decoration
- Structured feedback over conversation
- Calm interfaces over flashy interactions
- Professional polish over gamification
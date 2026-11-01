# Socratic Math Tutor: Compassionate Step-by-Step Learning Atelier

A patient, Socratic AI mathematics companion designed for complex calculus and algebra problems. When a student uploads or snaps a photo of a problem, the tutor never dumps the final answer; instead, it establishes the problem context, clarifies the goal, and guides the student through one manageable step at a time. Dedicated inquiry hooks—such as "Why did we do that?", "Give me a gentle hint", and "Explain the intuition"—empower students to master foundational concepts without math anxiety.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and design choices were confirmed in Phase 1 interactive alignment and will govern implementation:

- **Socratic Pacing Model**: Step-by-step dialogue with checkpoint hints and concept checks. The tutor breaks problems down into progressive milestones, asking guided questions rather than calculating answers for the student.
- **Learning Workspace Layout**: Side-by-side split view. Left zone features the uploaded problem image viewer with pan/zoom and an interactive canvas scratchpad for student work; right zone hosts the scrollable Socratic dialogue thread and contextual inquiry actions.
- **Visual Aesthetic & Theme**: Warm academic atelier. Subtle cream parchment tones (`#FAF7F2`), warm terracotta accents (`#C85A32`), dark espresso ink typography (`#2A2421`), and elegant editorial serif headers paired with crisp mathematical type.
- **Gemini Intelligence Strategy**:
  - Image recognition & deep mathematical step breakdown powered by `gemini-4-argon` with `ThinkingLevel.HIGH` to accurately untangle handwritten or printed calculus/algebra problems.
  - Multi-turn conversational Socratic tutoring powered by Express backend API routes ensuring zero client-side API key exposure.
  - Fast feedback & conceptual definitions handled via responsive streaming routes.

---

## 1. Overview & Core Concept

### What It Does
1. **Problem Capture & Inspection**: Students upload a photo of a calculus (derivatives, integrals, limits, series, differential equations) or algebra (polynomials, matrices, eigenvalues, systems of equations) problem, or select from pre-loaded calculus/algebra challenge cards.
2. **First-Step Scaffolding**: Rather than providing a solution sheet, the tutor identifies the core pattern (e.g. *integration by parts*, *chain rule*, *u-substitution*, *factoring by grouping*), confirms understanding of the objective, and prompts the student on Step 1.
3. **Targeted "Why Did We Do That?" Concept Inquiries**: At any step, the student can click dedicated inquiry buttons or ask custom questions. The tutor pauses forward progress to illuminate the underlying theorem, algebraic rule, or intuitive geometric meaning before returning to the problem flow.
4. **Interactive Side-by-Side Scratchpad**: A digital slate allowing students to handwrite steps, test hypotheses, or circle regions of the uploaded problem image with pen, highlighter, and eraser tools.
5. **Compassionate Teacher Persona**: Warm, empathetic, and encouraging voice designed to diminish math anxiety, celebrate small breakthroughs, and guide self-discovery.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Intake Flow**:
   - Welcome banner with inspiring, calm atmosphere.
   - Drag-and-drop photo uploader, camera capture trigger, or 1-click curated examples (e.g., Integration by Parts with $\int x e^{2x} dx$, Implicit Differentiation, Trigonometric Substitution, Partial Fraction Decomposition).
2. **Interactive Tutoring Stage**:
   - Left Zone (Workspace): Uploaded problem preview with toggleable annotation overlay + tabbed canvas scratchpad with undo/redo, pen width, and color palette.
   - Right Zone (Dialogue): Conversational Socratic thread with formatted math expressions ($\LaTeX$ / KaTeX rendering), progress milestone pills (`Step 1 of 4: Setting up u and dv`), and action drawer:
     - 💡 *"Why did we do that?"*
     - 🔍 *"What does this term mean?"*
     - 🌱 *"Give me a smaller hint"*
     - ✍️ *"Here's my attempt for the next step..."*
3. **Reflection & Mastery**:
   - When the student successfully arrives at the solution through their own reasoning, the tutor presents a celebratory concept summary reinforcing what was learned.

### Visual Identity & Theme Tokens
- **Canvas Base**: Soft Parchment (`#FAF7F2`), Secondary Card Surface (`#F3EFEA`), Border Hairlines (`#E5DDD3`).
- **Primary Ink**: Dark Sepia (`#26201C`), Muted Body (`#5C534D`), Subtle Hint (`#8C8178`).
- **Warm Accents**: Terracotta (`#C85A32`), Clay Hover (`#B34B26`), Ochre Highlight (`#D9822B`), Forest Sage for correct milestones (`#3F6E54`).
- **Typography Pairing**:
  - Display: `Fraunces` / `Playfair Display` (warm, literary academic serif).
  - Body: `Plus Jakarta Sans` (highly legible, human-centric sans).
  - Math & Formulas: Monospace & Serif math notation with KaTeX formatting.

---

## 3. Technical Architecture & System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Client Browser (React 19 / Vite)                   │
├────────────────────────────────┬───────────────────────────────────────┤
│    Problem Canvas & Slate      │       Socratic Dialogue Thread        │
│  - Photo Upload / Gallery      │  - Step-by-step Socratic chat history │
│  - HTML5 Canvas Scratchpad     │  - KaTeX math formula rendering       │
│  - Tooling (Pen/Marker/Eraser) │  - "Why did we do that?" quick chips  │
└───────────────┬────────────────┴───────────────────┬───────────────────┘
                │                                    │
                │ Base64 Image & Canvas State        │ Multi-turn Chat
                ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Express Full-Stack Server (server.ts)               │
├────────────────────────────────────────────────────────────────────────┤
│  POST /api/analyze-problem                                             │
│    - Accepts image (base64) + optional initial student note            │
│    - Invokes Gemini (@google/genai) with gemini-4-argon & HIGH THINKING │
│    - System instruction: Compassionate Socratic Calculus & Algebra     │
│  POST /api/tutor-chat                                                  │
│    - Multi-turn conversation with active step state & concept inquiries │
│    - Dedicated handlers for "why_explanation", hints, or student input  │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Google Gemini API (@google/genai)                 │
│  - Model: gemini-4-argon (Image analysis & high-thinking reasoning)    │
│  - ThinkingLevel: HIGH                                                 │
│  - Persona: Patient, empathetic academic mentor                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Implementation Steps

1. **Server Setup (`server.ts`)**:
   - Configure full-stack Express server with Vite middleware in development and static serving in production.
   - Implement `/api/analyze-problem` using `@google/genai` with `gemini-4-argon` and `ThinkingLevel.HIGH` as required.
   - Implement `/api/tutor-chat` for seamless multi-turn conversational tutoring.
2. **Mathematics & Markdown Engine**:
   - Install `katex` (with CSS) or equivalent math formatting utility for clean rendering of derivatives, integrals, fractions, and matrices.
3. **Interactive Canvas Scratchpad**:
   - Lightweight, responsive HTML5 canvas with smooth stroke interpolation, pen/highlighter modes, clear, undo, and problem-overlay alignment.
4. **Socratic Tutor State Manager**:
   - Manage problem image, milestone step tracker, chat history, active concept focus, and quick-prompt suggestions.
5. **Warm Atelier UI Components**:
   - Top Bar contract with Atelier brand mark, step indicator, and new problem reset.
   - Split-screen workspace with responsive tab switching for smaller screens.
   - Polished empty state with 4 sample calculus/algebra problems for instant zero-friction testing.
   - Verification with `compile_applet`.

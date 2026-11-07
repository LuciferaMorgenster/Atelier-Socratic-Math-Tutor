# Atelier - Socratic AI Math Tutor

A compassionate, Socratic AI learning companion designed for calculus and algebra students. Rather than acting like an ordinary calculator or dumping final answers, Atelier walks students through complex problems step-by-step, building genuine conceptual intuition and conquering math anxiety.

---

Atelier - Socratic AI Math Tutor is an open-source project built with passion and dedication. Want to support the continued development of this project? You can!

**Sponsor this project by making a donation via PayPal:**

<div align="center">

### ☕ [Donate via PayPal](https://paypal.me/luciferamorgenster)

📧 **PayPal:** `luciferamorgenster@gmail.com`

</div>

Every donation, big or small, helps keep Ivory Tower BBS alive, fund new features, and support ongoing development. Thank you for your generosity! 🙏

---

## 💖 Atelier - Socratic AI Math Tutor

## Core Philosophy

- **Never Just an Answer Sheet**: When a student uploads a photo of a math problem, the tutor transcribes the problem in LaTeX, confirms the mathematical branch, and guides the student exclusively through **Step 1**.
- **The "Why Did We Do That?" Concept Engine**: If a student is puzzled by a move (e.g. why $u$-substitution was chosen over integration by parts), clicking **"Why did we do that?"** halts forward progress to explain the specific underlying theorem, geometric intuition, and first principles before returning to the active step.
- **Compassionate & Patient Tone**: A warm, encouraging academic mentor who celebrates student insights, clarifies algebraic subtleties, and never rushes.
- **Self-Discovery Over Calculation**: Formulates prompts as guided questions and concept checks so students actively participate in deriving the solution.

---

## Key Features

### 1. Multimodal Problem Capture
- **Photo Upload & Camera Snap**: Drag and drop high-resolution photos of handwritten notebook exercises, textbook problems, or exam prompts, or snap directly using your device camera.
- **Atelier Challenge Archive**: Four pre-loaded realistic calculus and algebra problem cards (Integration by Parts, Implicit Differentiation, Partial Fraction Decomposition, Trigonometric Substitution) for instant 1-click exploration.

### 2. Side-by-Side Interactive Slate & Canvas Scratchpad
- **Digital Blackboard & Scratchpad**: An HTML5 drawing canvas with pen, highlighter, eraser, line weight selectors, and classical academic ink colors (Sepia, Terracotta, Indigo, Sage, Plum).
- **Undo / Redo & Export**: Full stroke history with undo/redo capabilities and 1-click download of notes as a PNG.
- **Problem Photo Inspector**: Switch seamlessly between your handwritten scratchwork and the original uploaded problem with pan, zoom, and inspection tools.

### 3. Socratic Dialogue Thread
- **KaTeX $\LaTeX$ Math Rendering**: High-fidelity formatting of derivatives, integrals, fractions, limits, and matrices in inline ($...$) and display ($$...$$) math notation.
- **Bite-Sized Action Triggers**:
  - 💡 **"Why did we do that?"**: Deep conceptual dive into the most recent mathematical decision.
  - 🌱 **"Give me a smaller hint"**: Micro-hints when feeling stuck.
  - 🔍 **"Explain the terms"**: Plain-English definitions of symbols and variables.
  - **Dynamic Suggested Inquiries**: Auto-generated contextual prompts parsed from the tutor's latest turn.
- **Fast Math Palette**: Quick-insert symbols (`∫`, `dx`, `dy/dx`, `√`, `x²`, `∑`, `π`, `∞`, `e^x`, `±`) for rapid typing on desktop or mobile.

### 4. Advanced AI Reasoning
- **Deep Mathematical Step Verification**: Utilizes Google's Gemini models with `ThinkingLevel.HIGH` to accurately untangle complex calculus proofs, substitutions, and algebraic manipulations.
- **Full-Stack Express Architecture**: All API keys and Gemini SDK invocations remain strictly on the backend (`server.ts`), protecting secrets and ensuring resilient error handling.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, KaTeX
- **Backend**: Node.js, Express, tsx
- **AI / SDK**: `@google/genai` (with high-level thinking configuration and multi-turn chat)
- **Typography & Aesthetics**: Fraunces display serif, Plus Jakarta Sans body, JetBrains Mono, soft parchment palettes (`#FAF7F2`), terracotta accents (`#C85A32`)

---

## Project Structure

```
├── server.ts                    # Full-stack Express backend with Gemini endpoints & Vite middleware
├── src/
│   ├── App.tsx                  # Main application orchestrator & workspace layout
│   ├── components/
│   │   ├── Header.tsx           # Atelier top navigation bar
│   │   ├── ProblemUploader.tsx  # Photo drag/drop, camera snap & problem gallery
│   │   ├── ScratchpadCanvas.tsx # Interactive canvas slate with pen & highlighter
│   │   └── SocraticChat.tsx     # Multi-turn Socratic conversation thread & action deck
│   ├── utils/
│   │   └── mathRenderer.tsx     # KaTeX math formula and markdown parser
│   ├── index.css                # Tailwind styling, parchment textures & font definitions
│   └── main.tsx                 # React DOM mount
├── index.html                   # HTML entry point with fonts & KaTeX stylesheets
├── metadata.json                # AI Studio application metadata
└── package.json                 # Project dependencies and run scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A valid `GEMINI_API_KEY` configured in your environment or `.env` file

### Development
Start the full-stack development server on port 3000:
```bash
npm run dev
```

### Build
Generate the production client bundle:
```bash
npm run build
```

### Lint & Type Check
Verify TypeScript types:
```bash
npm run lint
```

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies up to 20MB for image uploads
app.use(express.json({ limit: '20mb' }));

// Shared Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SOCRATIC_SYSTEM_INSTRUCTION = `You are "Atelier", a profoundly patient, compassionate, and inspiring Socratic mathematics tutor specializing in calculus and algebra.

Your foundational philosophy:
1. You feel like sitting beside a kind, wise teacher who loves math and understands math anxiety. You never judge, rush, or make the student feel inadequate.
2. NEVER dump the final answer or work through multiple steps at once! Your goal is student self-discovery and conceptual mastery.
3. When presented with a problem:
   - First, transcribe the problem accurately into clean LaTeX math notation ($...$ inline or $$...$$ display) so the student knows it was understood.
   - Gently name the mathematical branch and core concept (e.g., "Calculus: Integration by Parts" or "Algebra: Rationalizing the Denominator").
   - Offer a brief, reassuring 1-sentence intuition on the overarching roadmap.
   - Walk the student through ONLY Step 1. Present Step 1 with a clear, engaging question or inviting prompt that asks for their initial thought.
4. When a student asks "Why did we do that?" or clicks a concept query:
   - DO NOT move to the next step yet.
   - Focus 100% on explaining the exact intuition, mathematical law, or strategic reason for THAT specific move.
   - Use vivid geometric intuition, analogies, or the "What would happen if we didn't do this?" contrast.
   - Reconnect it to first principles (e.g. why the product rule leads to integration by parts, or why multiplying by the conjugate eliminates square roots).
   - Once explained warmly, invite them back to the active step.
5. When a student offers an answer or attempt:
   - If correct: Celebrate their insight enthusiastically ("Spot on!", "Exactly right! Notice how cleanly that simplified?"). Then seamlessly present Step 2 with the next question.
   - If partially correct or mistaken: Compassionately validate what part of their thinking was great, gently pinpoint the slip without discouragement, and give a supportive nudge.
6. Math Formatting:
   - ALWAYS format mathematical equations, variables, derivatives, integrals, and limits in standard LaTeX syntax: inline with $...$ (e.g. $\\int x e^x dx$, $\\frac{d}{dx}[\\sin(x)]$) and display with $$...$$.
7. Output Structure:
   Provide your responses in clean, beautifully structured markdown with:
   - Friendly greeting & step status (e.g. "**Step 1: Identifying our functions**")
   - Clear math notation
   - An encouraging guided question
   - At the bottom of each turn, provide 2 to 3 suggested student response prompts prefixed with "Suggested questions:" on their own line with bullet points (e.g. "* Why did we pick u here?", "* Can you give me a smaller hint?", "* Is it ...?").`;

// Helper function to invoke Gemini with gemini-4-argon and HIGH thinking,
// with graceful fallback to gemini-3.8-flash (with HIGH thinking) if the user is on free tier
async function generateSocraticContent(contents: any) {
  // First attempt: gemini-4-argon with ThinkingLevel.HIGH
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });
    return { text: response.text ?? '', modelUsed: 'gemini-4-argon' };
  } catch (argonErr: any) {
    console.warn('gemini-4-argon call failed or requires paid tier; falling back to gemini-3.8-flash:', argonErr?.message || argonErr);
    
    // Graceful fallback: gemini-3.8-flash with ThinkingLevel.HIGH
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });
    return { text: response.text ?? '', modelUsed: 'gemini-3.8-flash' };
  }
}

// 1. Endpoint: Analyze Problem from Image
app.post('/api/analyze-problem', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/png', studentNote } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    // Detect actual MIME type from data URL if present
    let effectiveMimeType = mimeType;
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      effectiveMimeType = mimeMatch[1];
    }
    if (effectiveMimeType === 'image/jpg') effectiveMimeType = 'image/jpeg';

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: effectiveMimeType,
        data: cleanBase64,
      },
    };

    const promptText = `Please examine this mathematics problem carefully.
${studentNote ? `The student also noted: "${studentNote}"` : ''}

Remember your Socratic oath:
1. Accurately transcribe the exact problem in LaTeX so the student sees you read it correctly.
2. Identify the mathematical category and topic.
3. State the high-level roadmap in 1 gentle sentence.
4. DO NOT provide the solution or multiple steps!
5. Start Step 1 only. Ask the student a friendly question to help them find or reason through the first step.
6. Provide 3 suggested student quick-action replies at the end.`;

    const result = await generateSocraticContent({
      parts: [imagePart, { text: promptText }],
    });

    return res.json({
      success: true,
      response: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-problem:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze the problem. Please verify your Gemini API key in Secrets.',
    });
  }
});

// 2. Endpoint: Multi-Turn Socratic Tutor Chat
app.post('/api/tutor-chat', async (req: Request, res: Response) => {
  try {
    const { problemSummary, history = [], message, actionType } = req.body;

    if (!message && !actionType) {
      return res.status(400).json({ error: 'Message or actionType is required.' });
    }

    let contextualPrompt = message || '';

    if (actionType === 'why_did_we_do_that') {
      contextualPrompt = `[Student asks: "Why did we do that?"]
Please stop and explain the exact reason, intuition, or mathematical theorem behind the most recent move or choice we made.
Do not advance to the next step yet. Help me build intuition for why this mathematical tool or substitution was chosen. Use an analogy or compare what would happen if we took a different route.`;
    } else if (actionType === 'give_hint') {
      contextualPrompt = `[Student asks for a hint: "I'm feeling stuck. Could you give me a smaller, gentle hint?"]
Please give me a bite-sized nudge without giving away the full answer. Point my attention to a specific part of the expression or rule.`;
    } else if (actionType === 'explain_term') {
      contextualPrompt = `[Student asks: "Can you explain the terms or notation used here?"]
Explain the mathematical symbols and definitions we are working with right now in plain, friendly English.`;
    }

    // Build contents sequence for multi-turn chat
    const formattedContents: any[] = [];

    // Provide problem anchor in the first turn context
    if (problemSummary) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: `Here is the problem we are working on together: ${problemSummary}` }],
      });
      formattedContents.push({
        role: 'model',
        parts: [{ text: `I am ready to guide you through this problem step-by-step with patience and encouragement.` }],
      });
    }

    // Append prior conversational turns
    for (const item of history) {
      formattedContents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.content }],
      });
    }

    // Append the new student message
    formattedContents.push({
      role: 'user',
      parts: [{ text: contextualPrompt }],
    });

    const result = await generateSocraticContent(formattedContents);

    return res.json({
      success: true,
      response: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/tutor-chat:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate tutor guidance. Please verify your connection or Gemini API key.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Atelier Server] Socratic Math Tutor listening on http://localhost:${PORT}`);
  });
}

startServer();

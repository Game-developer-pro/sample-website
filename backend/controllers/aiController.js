import { GoogleGenerativeAI } from "@google/generative-ai";
import Question from "../models/Question.js";

const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-pro"
];

function getApiKeys() {
  const list = [];
  if (process.env.GEMINI_API_KEYS) {
    list.push(...process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()));
  }
  if (process.env.GEMINI_API_KEY) {
    list.push(...process.env.GEMINI_API_KEY.split(",").map(k => k.trim()));
  }
  let i = 1;
  while (process.env[`GEMINI_API_KEY_${i}`]) {
    list.push(process.env[`GEMINI_API_KEY_${i}`].trim());
    i++;
  }
  return [...new Set(list.filter(Boolean))];
}

let currentKeyIndex = 0;

function getGenAIInstance() {
  const keys = getApiKeys();
  if (keys.length === 0) {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }
  const key = keys[currentKeyIndex % keys.length];
  return new GoogleGenerativeAI(key);
}

function rotateApiKey() {
  const keys = getApiKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`[AI Key Switch] Switched to API key #${currentKeyIndex + 1} of ${keys.length}`);
  }
}

function buildPrompt({ question, options, correctAnswer, selectedAnswer, subject }) {
  const optionsList = Array.isArray(options)
    ? options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")
    : "";

  return `You are an expert Nigerian exam tutor helping students understand ${subject || "this"} questions for WAEC, NECO, and JAMB exams.

Question: ${question}

Options:
${optionsList}

Correct Answer: ${correctAnswer}
${selectedAnswer && selectedAnswer !== correctAnswer ? `Student's Answer: ${selectedAnswer} (WRONG)` : ""}

Please provide:
1. **Why the correct answer is right** — A clear explanation of why "${correctAnswer}" is correct.
2. **Why the other options are wrong** — Briefly explain why each other option is incorrect.
3. **Key concept** — The underlying concept, formula, or rule to remember.
4. **Memory tip** — A simple tip or mnemonic for the exam.

Be concise, friendly, and exam-focused. Use plain language for a secondary school or university entrance student.`;
}

// @desc    Check for cached explanation (fast path used internally)
// Returns the cached explanation string or null
async function getCachedExplanation(questionText) {
  try {
    const doc = await Question.findOne({ question: questionText }).select("aiExplanation").lean();
    return doc?.aiExplanation || null;
  } catch {
    return null;
  }
}

// @desc    Persist explanation to DB cache after streaming completes
async function cacheExplanation(questionText, explanation) {
  try {
    await Question.findOneAndUpdate(
      { question: questionText },
      { aiExplanation: explanation },
      { new: false }
    );
  } catch (err) {
    console.warn("⚠️ Could not cache AI explanation:", err.message);
  }
}

// @desc    Stream AI explanation via Server-Sent Events
// @route   GET /api/ai/explain-stream
// @access  Private
export const explainQuestionStream = async (req, res) => {
  const { question, options, correctAnswer, subject, selectedAnswer } = req.query;

  if (!question || !correctAnswer) {
    return res.status(400).json({ message: "Question and correct answer are required" });
  }

  // --- Cache hit: serve instantly without SSE ---
  const cached = await getCachedExplanation(question);
  if (cached) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ chunk: cached, done: false, cached: true })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  // --- Cache miss: stream from Gemini ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const parsedOptions = options ? (typeof options === "string" ? JSON.parse(options) : options) : [];
  const prompt = buildPrompt({ question, options: parsedOptions, correctAnswer, selectedAnswer, subject });

  let streamSuccess = false;
  let lastError = null;

  const totalKeys = getApiKeys().length || 1;
  const maxAttempts = totalKeys * MODEL_CANDIDATES.length;
  let attempts = 0;

  for (const modelName of MODEL_CANDIDATES) {
    if (streamSuccess) break;
    for (let k = 0; k < totalKeys; k++) {
      try {
        const genAI = getGenAIInstance();
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 2048 },
        });

        const streamResult = await model.generateContentStream(prompt);
        let fullText = "";

        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
          }
        }

        // Signal completion
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

        // Persist to DB in background (non-blocking)
        cacheExplanation(question, fullText);
        streamSuccess = true;
        break;
      } catch (err) {
        console.warn(`Model ${modelName} on key #${currentKeyIndex + 1} failed:`, err.message || err);
        rotateApiKey();
        lastError = err;
      }
    }
  }

  if (!streamSuccess) {
    console.error("All AI stream attempts failed:", lastError);
    res.write(`data: ${JSON.stringify({ error: "AI service unavailable. Please try again.", done: true })}\n\n`);
    res.end();
  }
};

// @desc    Generate AI explanation (non-streaming, kept for backwards compatibility)
// @route   POST /api/ai/explain
// @access  Private
export const explainQuestion = async (req, res) => {
  try {
    const { question, options, correctAnswer, subject, selectedAnswer } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ message: "Question and correct answer are required" });
    }

    // DB cache check
    const cached = await getCachedExplanation(question);
    if (cached) {
      return res.json({ explanation: cached, cached: true });
    }

    const prompt = buildPrompt({ question, options, correctAnswer, selectedAnswer, subject });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 2048 },
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        cacheExplanation(question, text);
        return res.json({ explanation: text });
      } catch (err) {
        console.warn(`Model ${modelName} failed for explain, trying next fallback:`, err.message || err);
      }
    }

    res.status(500).json({ message: "An unexpected error occurred with the AI service. Please try again." });
  } catch (err) {
    console.error("AI explain error:", err);
    res.status(500).json({ message: "An unexpected error occurred. Please try again." });
  }
};

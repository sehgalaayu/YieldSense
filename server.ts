import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function rateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!rateLimit(ip, 20)) {
        return res.status(429).json({
          error: "Too many messages. Please wait before sending more.",
        });
      }

      const { messages, userContext, language } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages are required" });
      }

      const systemPrompt = `You are WealthSense AI, a friendly and knowledgeable wealth advisor for Indian retail investors.

USER CONTEXT:
- Principal: ₹${userContext?.principal || 100000}
- Tax Slab: ${userContext?.taxSlab || 20}%
- Language preference: ${language || "en"}

RULES:
- Detect language from user message. Respond in SAME language.
- Hindi responses: simple conversational Hindi, not formal.
- Always give direct answer first, then explanation.
- Use ₹ symbol and actual rupee figures.
- Keep responses under 150 words.
- Only answer FD, MF, tax, investment questions.
- For anything else say: "I only help with investment questions."
- End every response with one clear next action.

FD KNOWLEDGE:
- TDS: 10% deducted if annual interest > ₹40,000
- DICGC: insures deposits up to ₹5 lakh per bank
- Small Finance Banks: higher rates, still DICGC insured
- NBFCs (Bajaj, Shriram): NOT DICGC insured

MF KNOWLEDGE:
- Regular vs Direct: Regular has 0.5-1.5% extra expense ratio
- LTCG equity: 12.5% on gains above ₹1.25L (held > 1 year)
- STCG equity: 20% (held < 1 year)
- Liquid funds: withdrawable in 1 business day
- ELSS: 3-year lock-in, 80C deduction up to ₹1.5L

GOAL-BASED ADVICE:
- Emergency fund → Liquid MF only (instant withdrawal)
- Under 2 years → FD preferred over equity MF
- 2-5 years → Conservative or Balanced MF
- 5+ years → Equity MF (Large or Flexi Cap)
- 10+ years → Aggressive equity (Mid or Small Cap)`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://yieldsense-five.vercel.app",
            "X-Title": "WealthSense",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            max_tokens: 2000,
            stream: false,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            ],
          }),
          signal: AbortSignal.timeout(25000),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter error:", response.status, errorText);
        return res.status(500).json({
          error: "AI advisor is temporarily unavailable. Please try again.",
        });
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      const reply =
        msg?.content ||
        msg?.reasoning ||
        data.choices?.[0]?.text ||
        data.response ||
        data.output;

      if (!reply) {
        console.error(
          "No reply found in response:",
          JSON.stringify(data).substring(0, 300),
        );
        return res.status(500).json({
          error: "No response from AI. Please try again.",
        });
      }

      res.json({ reply, content: reply });
    } catch (err: any) {
      console.error("Chat error:", err?.message || err);

      if (err?.name === "TimeoutError") {
        return res.status(504).json({
          error: "AI took too long to respond. Please try again.",
        });
      }

      res.status(500).json({
        error: "Something went wrong. Please try again.",
      });
    }
  });

  app.post("/api/wealthsense-advisor", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (!rateLimit(ip, 20)) {
        return res.status(429).json({
          error: "Too many messages. Please wait before sending more.",
        });
      }

      const { messages, userContext, language } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages are required" });
      }

      const systemPrompt = `You are WealthSense AI, a friendly and knowledgeable wealth advisor for Indian retail investors.

USER CONTEXT:
- Principal: ₹${userContext?.principal || 100000}
- Tax Slab: ${userContext?.taxSlab || 20}%
- Language preference: ${language || "en"}

RULES:
- Detect language from user message. Respond in SAME language.
- Hindi responses: simple conversational Hindi, not formal.
- Always give direct answer first, then explanation.
- Use ₹ symbol and actual rupee figures.
- Keep responses under 150 words.
- Only answer FD, MF, tax, investment questions.
- For anything else say: "I only help with investment questions."
- End every response with one clear next action.

FD KNOWLEDGE:
- TDS: 10% deducted if annual interest > ₹40,000
- DICGC: insures deposits up to ₹5 lakh per bank
- Small Finance Banks: higher rates, still DICGC insured
- NBFCs (Bajaj, Shriram): NOT DICGC insured

MF KNOWLEDGE:
- Regular vs Direct: Regular has 0.5-1.5% extra expense ratio
- LTCG equity: 12.5% on gains above ₹1.25L (held > 1 year)
- STCG equity: 20% (held < 1 year)
- Liquid funds: withdrawable in 1 business day
- ELSS: 3-year lock-in, 80C deduction up to ₹1.5L

GOAL-BASED ADVICE:
- Emergency fund → Liquid MF only (instant withdrawal)
- Under 2 years → FD preferred over equity MF
- 2-5 years → Conservative or Balanced MF
- 5+ years → Equity MF (Large or Flexi Cap)
- 10+ years → Aggressive equity (Mid or Small Cap)`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://yieldsense-five.vercel.app",
            "X-Title": "WealthSense",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            max_tokens: 2000,
            stream: false,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            ],
          }),
          signal: AbortSignal.timeout(25000),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter error:", response.status, errorText);
        return res.status(500).json({
          error: "AI advisor is temporarily unavailable. Please try again.",
        });
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      const reply =
        msg?.content ||
        msg?.reasoning ||
        data.choices?.[0]?.text ||
        data.response ||
        data.output;

      if (!reply) {
        console.error(
          "No reply found in response:",
          JSON.stringify(data).substring(0, 300),
        );
        return res.status(500).json({
          error: "No response from AI. Please try again.",
        });
      }

      res.json({ reply, content: reply });
    } catch (err: any) {
      console.error("Chat error:", err?.message || err);

      if (err?.name === "TimeoutError") {
        return res.status(504).json({
          error: "AI took too long to respond. Please try again.",
        });
      }

      res.status(500).json({
        error: "Something went wrong. Please try again.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

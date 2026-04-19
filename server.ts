import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OpenRouter AI Proxy
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userContext, language } = req.body;
      
      const SYSTEM_PROMPT = `You are YieldSense AI, an FD advisor for Indian retail investors. You help users compare Fixed Deposits, understand post-tax yields, and make smart decisions.

RULES:
- Detect language from user message. Respond in same language (Hindi or English).
- For Hindi: use simple conversational Hindi, not formal.
- Always give a direct answer first, then explanation.
- Use ₹ symbol and actual rupee figures.
- Keep responses under 120 words.
- Only answer FD-related questions. For anything else: "I only help with Fixed Deposit questions."
- Never give advice on stocks, crypto, or mutual funds.
- End every response with one follow-up question or action.

FD TERMS (use these explanations):
- p.a. = per year / प्रति वर्ष
- TDS = Tax Deducted at Source / स्रोत पर कर कटौती — bank deducts 10% if annual interest > ₹40,000
- DICGC = Deposit insurance up to ₹5 lakh per bank / ₹5 लाख तक जमा बीमा
- Cumulative FD = interest paid at maturity / ब्याज अंत में मिलता है
- Premature withdrawal = breaking FD early, 0.5-1% penalty
- Small Finance Banks = higher rates but smaller institutions, still DICGC insured`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://yieldsense.vercel.app",
          "X-Title": "YieldSense",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.7-sonnet",
          stream: false,
          max_tokens: 500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter error: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;
      res.json({ reply });
    } catch (error: any) {
      console.error("OpenRouter API error:", error);
      res.status(500).json({ error: "Failed to communicate with AI" });
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

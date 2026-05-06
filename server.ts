import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildSystemPrompt,
  getLatestUserMessage,
  toGeminiHistory,
} from "./src/lib/wealthsenseAi";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Rate Limiting for AI Proxy
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // Limit each IP to 20 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error:
        "Too many AI requests from this IP, please try again after 15 minutes.",
    },
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  const handleChat = async (req: express.Request, res: express.Response) => {
    console.log("--- AI CHAT REQUEST RECEIVED ---");
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res
          .status(500)
          .json({ error: "GEMINI_API_KEY is missing in .env file." });
      }
      const { messages = [], userContext, language } = req.body;
      const latestMessage = getLatestUserMessage(messages);
      if (!latestMessage.trim()) {
        return res
          .status(400)
          .json({ error: "At least one user message is required." });
      }

      console.log(`User query: "${latestMessage}"`);

      // Try models in order — each has its own free-tier quota
      const modelIds = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];
      let lastError: any = null;

      for (const modelId of modelIds) {
        try {
          const model = genAI.getGenerativeModel({ model: modelId });
          const systemPrompt = buildSystemPrompt({ userContext, language });
          const history = [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "model",
              parts: [
                {
                  text: "Understood. I am WealthSense AI, your comprehensive wealth advisor. How can I help you today?",
                },
              ],
            },
            ...toGeminiHistory(messages),
          ];
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(latestMessage);
          const reply =
            result.response.text().trim() ||
            "I'm sorry, I'm having trouble thinking right now. Please try again.";
          console.log(`✅ Response from ${modelId}`);
          return res.json({ reply, content: reply });
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ ${modelId} failed: ${err.status || err.message}`);
          if (err.status === 429 || err.status === 503) continue; // Retry next model
          throw err;
        }
      }

      // All models exhausted — return a graceful fallback
      if (lastError?.status === 429 || lastError?.status === 503) {
        console.warn("All Gemini models rate-limited. Returning fallback.");
        const fallback =
          language === "hi"
            ? "🙏 मैं अभी व्यस्त हूँ — कृपया 1 मिनट बाद फिर पूछें। इस बीच, आप Compare या Calculator पेज पर अपने नंबर देख सकते हैं।"
            : "⏳ I'm briefly at capacity — please retry in about a minute. Meanwhile, check the **Compare** or **Calculator** pages for instant numbers on your investments.";
        return res.json({ reply: fallback, content: fallback });
      }

      throw lastError;
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res
        .status(500)
        .json({ error: "Failed to communicate with AI: " + error.message });
    }
  };

  // Gemini AI Proxy
  app.post("/api/chat", apiLimiter, handleChat);
  app.post("/api/wealthsense-advisor", apiLimiter, handleChat);

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

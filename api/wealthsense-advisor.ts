export const config = {
  runtime: "edge",
};
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildSystemPrompt,
  getLatestUserMessage,
  toGeminiHistory,
} from "../src/lib/wealthsenseAi";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is missing in .env file." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { messages = [], userContext, language } = body;
    const latestMessage = getLatestUserMessage(messages);
    if (!latestMessage.trim()) {
      return new Response(
        JSON.stringify({ error: "At least one user message is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        const reply = result.response.text().trim() || "I'm sorry, I'm having trouble thinking right now. Please try again.";
        
        return new Response(JSON.stringify({ content: reply }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`[Edge] ${modelId} failed: ${err.status || err.message}`);
        if (err.status === 429 || err.status === 503) continue;
        throw err;
      }
    }

    if (lastError?.status === 429 || lastError?.status === 503) {
      const fallback =
        language === "hi"
          ? "🙏 मैं अभी व्यस्त हूँ — कृपया 1 मिनट बाद फिर पूछें। इस बीच, आप Compare या Calculator पेज पर अपने नंबर देख सकते हैं।"
          : "⏳ I'm briefly at capacity — please retry in about a minute. Meanwhile, check the **Compare** or **Calculator** pages for instant numbers on your investments.";
      return new Response(JSON.stringify({ content: fallback }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw lastError;
  } catch (error: any) {
    console.error("Gemini edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to communicate with AI" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

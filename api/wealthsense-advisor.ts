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
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { messages = [], userContext, language } = body;
    const latestMessage = getLatestUserMessage(messages);
    if (!latestMessage.trim()) {
      return new Response(
        JSON.stringify({ error: "At least one user message is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: buildSystemPrompt({ userContext, language }),
    });

    const history = toGeminiHistory(messages);
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(latestMessage);
    const reply = result.response.text() || "No response received";

    return new Response(JSON.stringify({ content: reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Gemini edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to communicate with AI" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

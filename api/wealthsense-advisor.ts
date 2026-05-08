export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log("[Edge] Request received");

    // Check API key exists
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[Edge] OPENROUTER_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    console.log("[Edge] API key present:", apiKey.substring(0, 10) + "...");

    const body = await req.json();
    console.log("[Edge] Messages count:", body.messages?.length);
    const { messages = [], userContext, language } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one user message is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

    const openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

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
          messages: openRouterMessages,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Edge] OpenRouter HTTP", response.status);
      console.error("[Edge] OpenRouter error:", errorText.substring(0, 500));
      return new Response(
        JSON.stringify({
          error: `OpenRouter error ${response.status}: ${errorText.substring(0, 100)}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
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
        "[Edge] No reply found in response:",
        JSON.stringify(data).substring(0, 300),
      );
      return new Response(
        JSON.stringify({ error: "No response from AI. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ content: reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("OpenRouter edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to communicate with AI: " + error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

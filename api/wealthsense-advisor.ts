export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are YieldSense AI, an FD advisor for Indian retail investors. You help users compare Fixed Deposits, understand post-tax yields, and make smart decisions.

RULES:
- Detect language from user message. Respond in same language (Hindi or English).
- For Hindi: use simple conversational Hindi, not formal.
- Always give a direct answer first, then explanation.
- Use ₹ symbol and actual rupee figures.
- Keep responses under 120 words.
- Your primary expertise is Fixed Deposits (FDs) and Mutual Funds (MFs) in India.
- You MUST answer questions about DICGC insurance, bank safety, TDS, taxes, and yields.
- If a question is clearly about something else, politely steer them back to FDs and MFs.
- Never say "I only help with..." if the question is related to financial safety, banking, or taxes.
- End every response with one follow-up question or action.

FD TERMS (use these explanations):
- p.a. = per year / प्रति वर्ष
- TDS = Tax Deducted at Source / स्रोत पर कर कटौती — bank deducts 10% if annual interest > ₹40,000
- DICGC = Deposit insurance up to ₹5 lakh per bank / ₹5 लाख तक जमा बीमा
- Cumulative FD = interest paid at maturity / ब्याज अंत में मिलता है
- Premature withdrawal = breaking FD early, 0.5-1% penalty
- Small Finance Banks = higher rates but smaller institutions, still DICGC insured`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://yieldsense-five.vercel.app",
        "X-Title": "YieldSense",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: false,
        max_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      console.error(`OpenRouter error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ error: `OpenRouter error: ${response.statusText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "No response received";
    
    return new Response(JSON.stringify({ content: reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Vercel Edge function error:", error);
    return new Response(JSON.stringify({ error: "Failed to communicate with AI" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

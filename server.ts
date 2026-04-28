import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

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
    message: { error: "Too many AI requests from this IP, please try again after 15 minutes." }
  });

  // OpenRouter AI Proxy
  app.post("/api/wealthsense-advisor", apiLimiter, async (req, res) => {
    console.log("--- AI CHAT REQUEST RECEIVED ---");
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: OPENROUTER_API_KEY is missing!");
        return res.status(500).json({ error: "OPENROUTER_API_KEY is missing in .env file." });
      }
      const { messages, userContext, language } = req.body;
      console.log(`User query: "${messages[messages.length-1]?.content}"`);
      
      const { principal, tenorMonths, taxSlab, recommendedFDs, mfHoldings, mfAnalysisResults } = userContext || {};

      let contextStr = "USER CONTEXT:\n";
      if (principal) contextStr += `- User is looking to invest: ₹${principal}\n`;
      if (tenorMonths) contextStr += `- Desired FD tenor: ${tenorMonths} months\n`;
      if (taxSlab) contextStr += `- User Tax Slab: ${taxSlab}%\n`;
      if (recommendedFDs && recommendedFDs.length > 0) {
        contextStr += `- Top recommended FD: ${recommendedFDs[0].name} at ${recommendedFDs[0].rate}%\n`;
      }
      
      if (mfHoldings && mfHoldings.length > 0) {
        contextStr += `- User's Mutual Fund Holdings:\n`;
        mfHoldings.forEach((h: any) => {
          contextStr += `  * Fund ID: ${h.fundId}, Invested: ₹${h.investedAmount}, Held for ${h.holdingPeriodMonths} months.\n`;
        });
      }
      if (mfAnalysisResults && mfAnalysisResults.length > 0) {
        contextStr += `- User's Mutual Fund Analysis Results:\n`;
        mfAnalysisResults.forEach((r: any) => {
          const a = r.analysis;
          contextStr += `  * Fund: ${r.regularFund.name}\n`;
          contextStr += `    Regular Expense: ${a.regularFund.expenseRatio}%, Direct Expense: ${a.directFund.expenseRatio}%\n`;
          contextStr += `    Should switch: ${a.shouldSwitch ? 'Yes' : 'No'} (Urgency: ${a.switchUrgency})\n`;
          contextStr += `    10Y Savings if switched: ₹${a.savingOver10Y}\n`;
          contextStr += `    Tax Note: ${a.taxNote}\n`;
          if (a.exitLoadWarning) contextStr += `    Exit Load Warning: ${a.exitLoadWarning}\n`;
        });
      }

      const SYSTEM_PROMPT = `You are WealthSense AI, a comprehensive wealth advisor for Indian retail investors. 
You help users with TWO things:
1. Fixed Deposits — post-tax yields, DICGC safety, bank comparisons
2. Mutual Funds — Direct vs Regular plans, expense ratios, switch recommendations

${contextStr}
MUTUAL FUND KNOWLEDGE:
- Regular plans have a distributor commission (0.5-2% extra expense ratio)
- Direct plans cut out the middleman — same fund, lower cost, higher returns
- LTCG on equity funds: 12.5% on gains above ₹1.25 lakh (held > 12 months)
- STCG on equity funds: 20% (held < 12 months)
- Debt funds: taxed as per income slab regardless of holding period
- ELSS funds: 3-year lock-in, qualifies for 80C deduction up to ₹1.5 lakh
- Exit load: typically 1% if redeemed within 1 year for equity funds

FD TERMS:
- p.a. = per year / प्रति वर्ष
- TDS = Tax Deducted at Source / स्रोत पर कर कटौती
- DICGC = Deposit insurance up to ₹5 lakh per bank
- Cumulative FD = interest paid at maturity
- Premature withdrawal = breaking FD early, 0.5-1% penalty
- Small Finance Banks = higher rates but smaller institutions, still DICGC insured

RESPONSE RULES:
- When asked about switching: always mention exit load and tax implications first
- Never recommend specific funds as "the best" — show tradeoffs
- For Hindi responses: keep financial terms in English (Direct, Regular, NAV, ELSS) but explain them in Hindi
- Always end with one actionable next step
- Detect language from user message. Respond in same language (Hindi or English).
- Use ₹ symbol and actual rupee figures.
- Keep responses under 150 words for simple questions, 300 for comparisons.
- Your primary expertise is Fixed Deposits (FDs) and Mutual Funds (MFs) in India.
- You MUST answer questions about DICGC insurance, bank safety, TDS, taxes, and yields.
- If a question is clearly about something else (like recipes or weather), politely steer them back to FDs and MFs.
- Never say "I only help with..." if the question is related to financial safety, banking, or taxes.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://yieldsense.vercel.app",
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
        throw new Error(`OpenRouter error: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "I'm sorry, I'm having trouble thinking right now. Please try again.";
      res.json({ content: reply });
    } catch (error: any) {
      console.error("OpenRouter API error:", error);
      res.status(500).json({ error: "Failed to communicate with AI: " + error.message });
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

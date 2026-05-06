export type WealthSenseChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type WealthSenseUserContext = {
  principal?: number;
  tenorMonths?: number;
  taxSlab?: number;
  recommendedFDs?: Array<{
    name?: string;
    rate?: number;
  }>;
  mfHoldings?: Array<{
    fundId?: string;
    investedAmount?: number;
    holdingPeriodMonths?: number;
  }>;
  mfAnalysisResults?: Array<{
    regularFund?: { name?: string };
    analysis?: {
      regularFund?: { expenseRatio?: number };
      directFund?: { expenseRatio?: number };
      shouldSwitch?: boolean;
      switchUrgency?: string;
      savingOver10Y?: number;
      taxNote?: string;
      exitLoadWarning?: string;
    };
  }>;
};

const systemPromptBase = `You are WealthSense AI, a comprehensive wealth advisor for Indian retail investors.
You help users with TWO things:
1. Fixed Deposits - post-tax yields, DICGC safety, bank comparisons
2. Mutual Funds - Direct vs Regular plans, expense ratios, switch recommendations

MUTUAL FUND KNOWLEDGE:
- Regular plans have a distributor commission (0.5-2% extra expense ratio)
- Direct plans cut out the middleman - same fund, lower cost, higher returns
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
- Never recommend specific funds as "the best" - show tradeoffs
- For Hindi responses: keep financial terms in English (Direct, Regular, NAV, ELSS) but explain them in Hindi
- Always end with one actionable next step
- Detect language from user message. Respond in same language (Hindi or English).
- Use ₹ symbol and actual rupee figures.
- Keep responses under 150 words for simple questions, 300 for comparisons.
- When the user asks what to do next, give a short daily action plan they can reuse.
- If relevant, mention maturity reminders, watchlist checks, or reinvestment timing.
- Your primary expertise is Fixed Deposits (FDs) and Mutual Funds (MFs) in India.
- You MUST answer questions about DICGC insurance, bank safety, TDS, taxes, and yields.
- If a question is clearly about something else (like recipes or weather), politely steer them back to FDs and MFs.
- Never say "I only help with..." if the question is related to financial safety, banking, or taxes.`;

function getRecommendedFDContext(userContext?: WealthSenseUserContext) {
  const lines: string[] = [];

  if (userContext?.principal) {
    lines.push(`- User is looking to invest: ₹${userContext.principal}`);
  }

  if (userContext?.tenorMonths) {
    lines.push(`- Desired FD tenor: ${userContext.tenorMonths} months`);
  }

  if (typeof userContext?.taxSlab === "number") {
    lines.push(`- User Tax Slab: ${userContext.taxSlab}%`);
  }

  if (userContext?.recommendedFDs?.length) {
    lines.push(
      `- Top recommended FD: ${userContext.recommendedFDs[0]?.name || "N/A"} at ${userContext.recommendedFDs[0]?.rate || "N/A"}%`,
    );
  }

  if (userContext?.mfHoldings?.length) {
    lines.push(`- User's Mutual Fund Holdings:`);
    userContext.mfHoldings.forEach((holding) => {
      lines.push(
        `  * Fund ID: ${holding.fundId || "N/A"}, Invested: ₹${holding.investedAmount || 0}, Held for ${holding.holdingPeriodMonths || 0} months.`,
      );
    });
  }

  if (userContext?.mfAnalysisResults?.length) {
    lines.push(`- User's Mutual Fund Analysis Results:`);
    userContext.mfAnalysisResults.forEach((result) => {
      const analysis = result.analysis;
      if (!analysis) return;

      lines.push(`  * Fund: ${result.regularFund?.name || "N/A"}`);
      lines.push(
        `    Regular Expense: ${analysis.regularFund?.expenseRatio ?? "N/A"}%, Direct Expense: ${analysis.directFund?.expenseRatio ?? "N/A"}%`,
      );
      lines.push(
        `    Should switch: ${analysis.shouldSwitch ? "Yes" : "No"} (Urgency: ${analysis.switchUrgency || "N/A"})`,
      );
      lines.push(
        `    10Y Savings if switched: ₹${analysis.savingOver10Y || 0}`,
      );
      if (analysis.taxNote) {
        lines.push(`    Tax Note: ${analysis.taxNote}`);
      }
      if (analysis.exitLoadWarning) {
        lines.push(`    Exit Load Warning: ${analysis.exitLoadWarning}`);
      }
    });
  }

  return lines.join("\n");
}

export function buildSystemPrompt({
  userContext,
}: {
  userContext?: WealthSenseUserContext;
  language?: "hi" | "en";
}) {
  const context = getRecommendedFDContext(userContext);
  return `${systemPromptBase}\n\nUSER CONTEXT:\n${context || "- No saved portfolio context provided."}`;
}

export function toGeminiHistory(messages: WealthSenseChatMessage[]) {
  return messages
    .slice(0, -1)
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

export function getLatestUserMessage(messages: WealthSenseChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index].content;
    }
  }

  return messages[messages.length - 1]?.content || "";
}

# YieldSense 🏦

> AI-powered Fixed Deposit intelligence layer for India. Compare FDs, calculate post-tax yields, and get advice in Hindi or English.

**Built for Blostem AI Builder Hackathon 2026 — Open Track**

## Live Demo
🔗 [yieldsense-five.vercel.app](https://yieldsense-five.vercel.app)

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js
- **AI**: OpenRouter (Claude 3.7 Sonnet) 
- **Charts**: Recharts
- **State**: Zustand

## Setup

```bash
git clone https://github.com/sehgalaayu/yieldsense
cd yieldsense
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY to .env
npm run dev
```

## Features
- 📊 FD comparison across 10 banks with post-tax yield calculations
- 🤖 AI advisor in Hindi + English (powered by Claude via OpenRouter)
- 🧮 Tax-aware yield calculator (TDS + income slab)
- 🛡️ DICGC insurance indicators
- 📱 Mobile-responsive

## Architecture
React frontend (Vite) → Express backend → OpenRouter API → Claude 3.7 Sonnet
FD data: curated JSON dataset (34 products, 10 banks, 5 tenors each)

## Disclaimer
Rates are indicative of market conditions in April 2026. Not financial advice.

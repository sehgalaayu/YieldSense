# WealthSense 🏦

> AI-powered FD + Mutual Fund intelligence for India. Compare FDs, calculate post-tax yields, analyze Mutual Fund portfolios, and get advice in Hindi or English.

**Built for Blostem AI Builder Hackathon 2026 — Open Track**

## Live Demo

🔗 [yieldsense-five.vercel.app](https://yieldsense-five.vercel.app)

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js
- **AI**: Google Gemini 2.0 Flash
- **Charts**: Recharts
- **State**: Zustand

## Setup

```bash
git clone https://github.com/sehgalaayu/yieldsense
cd yieldsense
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm run dev
```

## Features

- 📊 **Mutual Fund Switch Advisor**: Analyze Regular vs Direct MFs, calculate true 10-20 year costs, and get step-by-step switch recommendations factoring in exit loads and taxes.
- 📊 **FD Intelligence**: Compare FDs across 10 banks with post-tax yield calculations (TDS + income slab).
- 🤖 **WealthSense AI**: Bilingual advisor in Hindi + English (powered by Gemini 2.0 Flash).
- 🛡️ **Safety & Taxes**: Real-time DICGC insurance indicators and capital gains tax analysis.
- 📱 **Mobile-responsive** design with premium glassmorphism aesthetics.

## Architecture

React frontend (Vite) → Express backend → Gemini 2.0 Flash
FD data: curated JSON dataset (34 products, 10 banks, 5 tenors each)

## Disclaimer

Rates are indicative of market conditions in April 2026. Not financial advice.

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Coins,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SEBIBanner } from "../components/SEBIDisclaimer";
import { useUserStore } from "../store/userStore";
import { formatCurrency } from "../lib/calculator";

export default function CompareInstrumentsPage() {
  const { language } = useUserStore();

  const [principal, setPrincipal] = useState(100000);
  const [years, setYears] = useState(5);
  const [taxSlab, setTaxSlab] = useState(30);
  const [mfCategory, setMfCategory] = useState("Balanced Advantage");
  const [mfReturn, setMfReturn] = useState(12);
  const [fdRate, setFdRate] = useState(7.5);
  const [isSenior, setIsSenior] = useState(false);

  const mfCategoryBands: Record<
    string,
    { label: string; low: number; mid: number; high: number }
  > = {
    "Large Cap": { label: "Large Cap", low: 9, mid: 11, high: 13 },
    "Balanced Advantage": {
      label: "Balanced Advantage",
      low: 8,
      mid: 10.5,
      high: 12.5,
    },
    FlexiCap: { label: "Flexi Cap", low: 10, mid: 12.5, high: 15 },
    "Small Cap": { label: "Small Cap", low: 12, mid: 15, high: 18 },
    DebtHybrid: { label: "Debt Hybrid", low: 7, mid: 9, high: 11 },
  };

  const selectedMfBand =
    mfCategoryBands[mfCategory] || mfCategoryBands["Balanced Advantage"];
  const mfScenarioCards = [
    {
      label: language === "hi" ? "मंदी" : "Bear",
      rate: selectedMfBand.low,
      tone: "#F59E0B",
    },
    {
      label: language === "hi" ? "बेस" : "Base",
      rate: selectedMfBand.mid,
      tone: "#1A56DB",
    },
    {
      label: language === "hi" ? "तेजी" : "Bull",
      rate: selectedMfBand.high,
      tone: "#10B981",
    },
  ].map((scenario) => {
    const gross = principal * Math.pow(1 + scenario.rate / 100, years);
    const gain = gross - principal;
    const taxableGain = Math.max(0, gain - 125000);
    const tax = taxableGain * 0.125;
    const net = gross - tax;
    return {
      ...scenario,
      net: Math.round(net),
    };
  });

  const actualFdRate = isSenior ? fdRate + 0.5 : fdRate;

  // FD calc (quarterly compounding)
  const fdGross = principal * Math.pow(1 + actualFdRate / 100 / 4, 4 * years);
  const fdInterest = fdGross - principal;
  const fdTDS = fdInterest > 40000 ? fdInterest * 0.1 : 0;
  const fdTotalTax = fdInterest * (taxSlab / 100);
  const fdNet = fdGross - fdTotalTax;
  const fdPostTaxYield = (Math.pow(fdNet / principal, 1 / years) - 1) * 100;

  // MF calc (lumpsum)
  const mfGross = principal * Math.pow(1 + mfReturn / 100, years);
  const mfGain = mfGross - principal;
  const mfTaxableGain = Math.max(0, mfGain - 125000);
  const mfTax = mfTaxableGain * 0.125;
  const mfNet = mfGross - mfTax;
  const mfPostTaxReturn = (Math.pow(mfNet / principal, 1 / years) - 1) * 100;

  const fdWins = fdNet > mfNet;
  const diff = Math.abs(fdNet - mfNet);

  // Chart data
  const chartData = useMemo(
    () =>
      Array.from({ length: years }, (_, i) => {
        const yr = i + 1;
        const fdG = principal * Math.pow(1 + actualFdRate / 100 / 4, 4 * yr);
        const fdI = fdG - principal;
        const fdT = fdI * (taxSlab / 100);
        const fdN = fdG - fdT;
        const mfG = principal * Math.pow(1 + mfReturn / 100, yr);
        const mfGn = mfG - principal;
        const mfT = Math.max(0, mfGn - 125000) * 0.125;
        const mfN = mfG - mfT;
        return {
          year: `Y${yr}`,
          FD: Math.round(fdN),
          "Mutual Fund": Math.round(mfN),
        };
      }),
    [principal, years, taxSlab, mfReturn, actualFdRate],
  );

  const insights = [
    {
      icon: <ShieldCheck className="text-[#3B82F6]" size={24} />,
      title: language === "hi" ? "FD गारंटीड है" : "FD is guaranteed",
      body:
        language === "hi"
          ? `आपका ₹${principal.toLocaleString("en-IN")} FD में 100% सुरक्षित है। म्यूचुअल फंड शॉर्ट टर्म में गिर सकते हैं।`
          : `Your ₹${principal.toLocaleString("en-IN")} is 100% safe in an FD. Mutual funds can lose value in the short term.`,
    },
    {
      icon: <TrendingUp className="text-[#F59E0B]" size={24} />,
      title:
        language === "hi"
          ? "MF लंबे समय में ज़्यादा बढ़ते हैं"
          : "MF compounds harder over time",
      body:
        language === "hi"
          ? `${years}+ साल में, 1% ज़्यादा रिटर्न से ₹${Math.round(principal * (Math.pow(1.13, years) - Math.pow(1.07, years))).toLocaleString("en-IN")} अधिक मिलते हैं।`
          : `Over ${years}+ years, even a 1% higher annual return means ₹${Math.round(principal * (Math.pow(1.13, years) - Math.pow(1.07, years))).toLocaleString("en-IN")} more in your pocket.`,
    },
    {
      icon: <Coins className="text-[#10B981]" size={24} />,
      title:
        language === "hi" ? "टैक्स ट्रीटमेंट अलग है" : "Tax treatment differs",
      body:
        language === "hi"
          ? `FD ब्याज पर आपकी स्लैब (${taxSlab}%) से टैक्स लगता है। MF LTCG पर ₹1.25L से ऊपर 12.5% है — ${taxSlab > 12.5 ? "आपके लिए बेहतर" : "समान"}।`
          : `FD interest is taxed at your income slab (${taxSlab}%). MF LTCG is taxed at flat 12.5% above ₹1.25L — ${taxSlab > 12.5 ? "better for you" : "similar"} at your slab.`,
    },
    {
      icon: <Clock className="text-[#8B5CF6]" size={24} />,
      title:
        language === "hi"
          ? "समय सबसे ज़्यादा मायने रखता है"
          : "Time horizon matters most",
      body:
        years < 3
          ? language === "hi"
            ? `${years} साल के लिए, FD आमतौर पर बेहतर है — कम जोखिम, समान रिटर्न।`
            : `For ${years} year(s), FDs are usually better — less risk, similar returns.`
          : language === "hi"
            ? `${years} साल में, MF ऐतिहासिक रूप से FDs को हरा देते हैं अगर बाज़ार अपने लॉन्ग-टर्म एवरेज के करीब परफॉर्म करें।`
            : `For ${years} years, MFs historically beat FDs if markets perform near their long-term average.`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest mb-3">
          {language === "hi" ? "तुलना टूल" : "Comparison Tool"}
        </p>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-4 text-white tracking-tight"
          style={{ textWrap: "balance" as any }}
        >
          {language === "hi"
            ? "FD या Mutual Fund — आपके लिए क्या बेहतर है?"
            : "Should you put your money in an FD or a Mutual Fund?"}
        </h1>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          {language === "hi"
            ? "अपनी राशि और समय बताएं। हम दिखाते हैं कि हरेक क्या देगा — गारंटीड vs मार्केट-लिंक्ड।"
            : "Enter your amount and horizon. We show you exactly what each gives you — guaranteed vs market-linked."}
        </p>
      </motion.div>

      {/* Inputs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#112240] p-5 sm:p-6 rounded-2xl border border-[#1E3A5F] mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi" ? "निवेश राशि" : "Investment Amount"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-mono">
              ₹
            </span>
            <input
              type="number"
              value={principal === 0 ? "" : principal}
              onChange={(e) => {
                const v = e.target.value;
                setPrincipal(v === "" ? 0 : Number(v));
              }}
              onBlur={() => setPrincipal(Math.max(1000, principal))}
              className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 pl-8 pr-4 text-white focus:border-[#1A56DB] outline-none font-mono"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi"
              ? "निवेश अवधि (वर्ष)"
              : "Investment Horizon (Years)"}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-[#1A56DB] mt-2"
          />
          <div className="text-center text-white font-mono font-bold text-lg mt-1">
            {years} {language === "hi" ? "वर्ष" : "years"}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi" ? "टैक्स स्लैब" : "Your Tax Slab"}
          </label>
          <select
            value={taxSlab}
            onChange={(e) => setTaxSlab(Number(e.target.value))}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none"
          >
            <option value={0}>0% (No Tax)</option>
            <option value={5}>5%</option>
            <option value={20}>20%</option>
            <option value={30}>30%</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi" ? "MF श्रेणी" : "MF Category"}
          </label>
          <select
            value={mfCategory}
            onChange={(e) => {
              const nextCategory = e.target.value;
              setMfCategory(nextCategory);
              const preset = mfCategoryBands[nextCategory] || selectedMfBand;
              setMfReturn(preset.mid);
            }}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none"
          >
            <option value="Large Cap">Large Cap</option>
            <option value="Balanced Advantage">Balanced Advantage</option>
            <option value="FlexiCap">Flexi Cap</option>
            <option value="Small Cap">Small Cap</option>
            <option value="DebtHybrid">Debt Hybrid</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi"
              ? "अपेक्षित MF रिटर्न"
              : "Expected MF Return (%)"}
          </label>
          <input
            type="number"
            step={0.5}
            min={1}
            max={30}
            value={mfReturn}
            onChange={(e) => setMfReturn(Number(e.target.value))}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none font-mono"
          />
          <p className="text-[10px] text-[#64748B] mt-1">
            Nifty 50 historical avg: ~12% p.a.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi" ? "FD ब्याज दर" : "FD Interest Rate (%)"}
          </label>
          <input
            type="number"
            step={0.25}
            min={1}
            max={15}
            value={fdRate}
            onChange={(e) => setFdRate(Number(e.target.value))}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none font-mono"
          />
          <p className="text-[10px] text-[#64748B] mt-1">
            Top bank FDs: 7-8.5% p.a.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
            {language === "hi" ? "सीनियर सिटीज़न" : "Senior Citizen"}
          </label>
          <button
            onClick={() => setIsSenior(!isSenior)}
            className={`w-full py-3 rounded-xl border font-bold text-sm transition-all ${isSenior ? "bg-[#1A56DB] border-[#1A56DB] text-white" : "bg-[#0A0F1E] border-[#1E3A5F] text-[#64748B]"}`}
          >
            {isSenior ? "✓ Senior (+0.5%)" : "No"}
          </button>
        </div>
      </motion.div>

      {/* Winner Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className={`text-center py-4 px-6 rounded-xl border mb-8 ${fdWins ? "bg-blue-900/20 border-blue-800/40" : "bg-amber-900/20 border-amber-800/40"}`}
      >
        <p
          className="text-lg sm:text-xl font-bold"
          style={{ color: fdWins ? "#3B82F6" : "#F59E0B" }}
        >
          {fdWins ? "🛡️ FD wins" : "📈 MF likely wins"}
          {" "}by {formatCurrency(diff)} (base case)
        </p>
        <p className="text-xs text-[#64748B] mt-1">
          {fdWins
            ? language === "hi"
              ? "FD गारंटीड रिटर्न देता है। MF रिटर्न बाज़ार पर निर्भर करता है।"
              : "FD gives guaranteed returns. MF returns depend on markets."
            : language === "hi"
              ? `अगर ${selectedMfBand.label} अपेक्षित रिटर्न दे। गारंटीड नहीं है।`
              : `If ${selectedMfBand.label} delivers expected returns. Not guaranteed.`}
        </p>
        <p className="text-xs text-[#64748B] mt-0.5">
          {language === "hi"
            ? "पूरी तस्वीर के लिए नीचे Bear/Base/Bull देखें।"
            : "See Bear/Base/Bull scenarios above for the full picture."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {mfScenarioCards.map((scenario) => (
          <div
            key={scenario.label}
            className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-5"
          >
            <div
              className="text-[10px] uppercase tracking-[0.35em] mb-3"
              style={{ color: scenario.tone }}
            >
              {scenario.label}
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(scenario.net)}
            </div>
            <div className="text-xs text-[#64748B] mt-2">
              {scenario.rate.toFixed(1)}%{" "}
              {language === "hi" ? "रिटर्न पर" : "return case"}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* FD Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0A0F1E] border-2 border-[#3B82F6]/40 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck size={100} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-white">
              {language === "hi" ? "फिक्स्ड डिपॉज़िट" : "Fixed Deposit"}
            </h2>
          </div>
          <span className="inline-block text-[10px] font-bold bg-[#3B82F6]/20 text-[#3B82F6] px-2.5 py-1 rounded-full mb-5">
            🛡️ {language === "hi" ? "गारंटीड रिटर्न" : "GUARANTEED RETURNS"}
          </span>
          <div className="space-y-3 text-sm">
            <Row
              label={language === "hi" ? "ग्रॉस दर" : "Gross Rate"}
              value={`${actualFdRate.toFixed(2)}% p.a.`}
            />
            <Row
              label={language === "hi" ? "ग्रॉस मैच्योरिटी" : "Gross Maturity"}
              value={formatCurrency(fdGross)}
            />
            <Row label={`TDS (10%)`} value={`-${formatCurrency(fdTDS)}`} red />
            <Row
              label={`Tax (${taxSlab}%)`}
              value={`-${formatCurrency(fdTotalTax)}`}
              red
            />
          </div>
          <div className="mt-5 bg-[#112240] rounded-xl p-5 border border-[#1E3A5F]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">
              {language === "hi" ? "नेट मैच्योरिटी" : "NET MATURITY"}
            </div>
            <div className="text-3xl font-mono font-bold text-[#F59E0B]">
              {formatCurrency(fdNet)}
            </div>
            <div className="text-xs text-[#3B82F6] font-bold mt-1">
              Post-tax yield: {fdPostTaxYield.toFixed(2)}% p.a.
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#10B981]">
            <ShieldCheck size={14} /> DICGC Insured (up to ₹5L)
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            {language === "hi"
              ? "जोखिम: शून्य — बैंक द्वारा गारंटीड"
              : "Risk: Zero — Guaranteed by bank"}
          </div>
        </motion.div>

        {/* MF Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0A0F1E] border-2 border-[#F59E0B]/40 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp size={100} className="text-[#F59E0B]" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-white">
              {language === "hi"
                ? "म्यूचुअल फंड (डायरेक्ट)"
                : "Mutual Fund (Direct)"}
            </h2>
          </div>
          <span className="inline-block text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] px-2.5 py-1 rounded-full mb-5">
            📈 {language === "hi" ? "मार्केट-लिंक्ड" : "MARKET-LINKED"}
          </span>
          <div className="space-y-3 text-sm">
            <Row
              label={language === "hi" ? "अपेक्षित रिटर्न" : "Expected Return"}
              value={`${mfReturn}% p.a.`}
            />
            <Row
              label={language === "hi" ? "ग्रॉस मैच्योरिटी" : "Gross Maturity"}
              value={formatCurrency(mfGross)}
            />
            {mfTax === 0 ? (
              <div className="flex justify-between items-center border-b border-[#1E3A5F]/50 pb-2">
                <span className="text-[#94A3B8]">
                  LTCG Tax
                  <span className="block text-[10px] text-[#64748B]">
                    {language === "hi" ? "₹1.25L छूट के अंदर" : "Within ₹1.25L exemption"}
                  </span>
                </span>
                <span className="font-mono font-bold text-green-400">₹0</span>
              </div>
            ) : (
              <Row
                label={`LTCG Tax (12.5%)`}
                value={`-${formatCurrency(mfTax)}`}
                red
                note={
                  language === "hi"
                    ? "₹1.25L से ऊपर लाभ पर"
                    : "On gains above ₹1.25L"
                }
              />
            )}
          </div>
          <div className="mt-5 bg-[#F59E0B]/10 rounded-xl p-5 border border-[#F59E0B]/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B] mb-1">
              {language === "hi" ? "नेट मैच्योरिटी" : "NET MATURITY"}
            </div>
            <div className="text-3xl font-mono font-bold text-[#F59E0B]">
              {formatCurrency(mfNet)}
            </div>
            <div className="text-xs text-[#F59E0B] font-bold mt-1">
              Post-tax return: {mfPostTaxReturn.toFixed(2)}% p.a.
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={14} />{" "}
            {language === "hi"
              ? "DICGC बीमा नहीं — बाज़ार जोखिम"
              : "Not DICGC insured — Market risk applies"}
          </div>
          <div className="text-xs text-[#64748B] mt-1">
            {language === "hi"
              ? "जोखिम: मध्यम से उच्च"
              : "Risk: Moderate to High"}
          </div>
        </motion.div>
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#112240] p-5 sm:p-6 rounded-2xl border border-[#1E3A5F] mb-10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          {language === "hi"
            ? "वर्ष-दर-वर्ष मूल्य वृद्धि"
            : "Year-by-Year Value Growth"}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={4}>
            <XAxis
              dataKey="year"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v: number, name: string) => [
                `₹${Number(v).toLocaleString("en-IN")}`,
                name,
              ]}
              contentStyle={{
                background: "#112240",
                border: "1px solid #1E3A5F",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#94A3B8" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Bar dataKey="FD" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mutual Fund" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10"
      >
        {insights.map((ins, i) => (
          <div
            key={i}
            className="bg-[#0D1A2E] rounded-xl p-5 border border-[#1E3A5F] hover:border-[#1A56DB]/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              {ins.icon}
              <h4 className="text-white font-bold text-sm">{ins.title}</h4>
            </div>
            <p className="text-[#94A3B8] text-xs leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </motion.div>

      <SEBIBanner />
    </motion.div>
  );
}

function Row({
  label,
  value,
  red,
  note,
}: {
  label: string;
  value: string;
  red?: boolean;
  note?: string;
}) {
  return (
    <div
      className={`flex justify-between items-center border-b border-[#1E3A5F]/50 pb-2 ${red ? "text-red-400" : ""}`}
    >
      <span className="text-[#94A3B8]">
        {label}
        {note && (
          <span className="block text-[10px] text-[#64748B]">{note}</span>
        )}
      </span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}

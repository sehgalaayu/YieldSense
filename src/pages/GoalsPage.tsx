import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Trash2,
  PencilLine,
  ArrowRight,
  Loader2,
  Save,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import { formatCurrency } from "../lib/calculator";
import { SEBIBanner } from "../components/SEBIDisclaimer";

interface GoalTemplate {
  id: string;
  emoji: string;
  title: string;
  description: string;
  defaultAmount: number;
  recommendedInstrument: string;
  defaultHorizon: number;
  color: string;
}

const GOALS: GoalTemplate[] = [
  {
    id: "emergency",
    emoji: "🆘",
    title: "Emergency Fund",
    description: "3-6 months of expenses, accessible anytime",
    defaultAmount: 300000,
    recommendedInstrument: "FD",
    defaultHorizon: 1,
    color: "#3B82F6",
  },
  {
    id: "vacation",
    emoji: "✈️",
    title: "Dream Vacation",
    description: "That trip to Europe or Japan",
    defaultAmount: 200000,
    recommendedInstrument: "FD",
    defaultHorizon: 2,
    color: "#8B5CF6",
  },
  {
    id: "car",
    emoji: "🚗",
    title: "Buy a Car",
    description: "Down payment or full purchase",
    defaultAmount: 500000,
    recommendedInstrument: "MF",
    defaultHorizon: 3,
    color: "#F59E0B",
  },
  {
    id: "wedding",
    emoji: "💍",
    title: "Wedding Fund",
    description: "Your big day, planned in advance",
    defaultAmount: 1500000,
    recommendedInstrument: "MF",
    defaultHorizon: 5,
    color: "#EC4899",
  },
  {
    id: "house",
    emoji: "🏠",
    title: "Home Down Payment",
    description: "20% down on your dream home",
    defaultAmount: 2000000,
    recommendedInstrument: "MF",
    defaultHorizon: 7,
    color: "#10B981",
  },
  {
    id: "retirement",
    emoji: "🌴",
    title: "Retirement Corpus",
    description: "Financial freedom at your chosen age",
    defaultAmount: 10000000,
    recommendedInstrument: "MF",
    defaultHorizon: 25,
    color: "#F97316",
  },
  {
    id: "education",
    emoji: "🎓",
    title: "Child's Education",
    description: "College fund for your child",
    defaultAmount: 3000000,
    recommendedInstrument: "MF",
    defaultHorizon: 15,
    color: "#06B6D4",
  },
  {
    id: "custom",
    emoji: "🎯",
    title: "Custom Goal",
    description: "Set your own target",
    defaultAmount: 1000000,
    recommendedInstrument: "MF",
    defaultHorizon: 5,
    color: "#64748B",
  },
];

function calculateRequiredSIP(
  targetAmount: number,
  years: number,
  existingSavings: number,
  annualReturn: number,
): number {
  if (years <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualReturn / 100 / 12;
  const existingFV = existingSavings * Math.pow(1 + annualReturn / 100, years);
  const sipTargetFV = Math.max(0, targetAmount - existingFV);
  if (sipTargetFV <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(sipTargetFV / months);
  const requiredSIP =
    (sipTargetFV * monthlyRate) /
    ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));
  return Math.ceil(requiredSIP);
}

interface SavedGoal {
  id: string;
  goal_type: string;
  goal_emoji: string;
  goal_title: string;
  target_amount: number;
  target_date: string;
  existing_savings: number;
  monthly_sip: number;
  recommended_return: number;
  instrument_recommendation: string;
  created_at: string;
}

export default function GoalsPage() {
  const { user, setAuthModalOpen } = useAuthStore();
  const { language } = useUserStore();
  const navigate = useNavigate();

  const [selectedGoal, setSelectedGoal] = useState<GoalTemplate | null>(null);
  const [savedGoals, setSavedGoals] = useState<SavedGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculator state
  const [targetAmount, setTargetAmount] = useState(100000);
  const [yearsAway, setYearsAway] = useState(5);
  const [existingSavings, setExistingSavings] = useState(0);

  // Load saved goals
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSavedGoals(data as SavedGoal[]);
        setLoading(false);
      });
  }, [user]);

  const selectGoal = (g: GoalTemplate) => {
    setSelectedGoal(g);
    setTargetAmount(g.defaultAmount);
    setYearsAway(g.defaultHorizon);
    setExistingSavings(0);
    setSaveSuccess(false);
  };

  const scenarios = useMemo(
    () =>
      [
        {
          label:
            language === "hi"
              ? "सुरक्षित (FD/डेब्ट)"
              : "Conservative (FD/Debt)",
          rate: 7,
          color: "#3B82F6",
        },
        {
          label:
            language === "hi"
              ? "संतुलित (बैलेंस्ड MF)"
              : "Moderate (Balanced MF)",
          rate: 12,
          color: "#F59E0B",
        },
        {
          label:
            language === "hi"
              ? "आक्रामक (इक्विटी MF)"
              : "Aggressive (Equity MF)",
          rate: 15,
          color: "#10B981",
        },
      ].map((s) => {
        const sip = calculateRequiredSIP(
          targetAmount,
          yearsAway,
          existingSavings,
          s.rate,
        );
        const totalInvested = sip * yearsAway * 12;
        const wealthGained = targetAmount - totalInvested - existingSavings;
        return {
          ...s,
          sip,
          totalInvested,
          wealthGained: Math.max(0, wealthGained),
        };
      }),
    [targetAmount, yearsAway, existingSavings, language],
  );

  const primarySIP = scenarios[1].sip;
  const progressPct =
    existingSavings > 0
      ? Math.min(100, (existingSavings / targetAmount) * 100)
      : 0;

  const recommendation =
    yearsAway < 2
      ? language === "hi"
        ? "🛡️ FD का उपयोग करें — गारंटीड रिटर्न, कोई मार्केट जोखिम नहीं"
        : "🛡️ Use FD — guaranteed returns, no market risk"
      : yearsAway < 5
        ? language === "hi"
          ? "⚖️ FD सुरक्षा के लिए, बैलेंस्ड MF बेहतर रिटर्न के लिए"
          : "⚖️ FD for safety, balanced MF for better returns"
        : language === "hi"
          ? "📈 इक्विटी MF की दृढ़ता से सिफारिश — समय अस्थिरता को ठीक करता है"
          : "📈 Equity MF strongly recommended — time heals volatility";

  const handleSaveGoal = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSaving(true);
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + yearsAway);
    await supabase.from("user_goals").insert({
      user_id: user.id,
      goal_type: selectedGoal!.id,
      goal_emoji: selectedGoal!.emoji,
      goal_title: selectedGoal!.title,
      target_amount: targetAmount,
      target_date: targetDate.toISOString().split("T")[0],
      existing_savings: existingSavings,
      monthly_sip: primarySIP,
      recommended_return: 12,
      instrument_recommendation: yearsAway < 3 ? "FD" : "Equity MF",
    });
    const { data } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSavedGoals(data as SavedGoal[]);
    setSaving(false);
    setSaveSuccess(true);
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from("user_goals").delete().eq("id", id);
    setSavedGoals((prev) => prev.filter((g) => g.id !== id));
  };

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
          {language === "hi" ? "लक्ष्य-आधारित निवेश" : "Goal-Based Investing"}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-syne font-bold mb-4 text-white">
          {language === "hi"
            ? "अपने वित्तीय लक्ष्य तक पहुँचें"
            : "Reach your financial goals"}
        </h1>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          {language === "hi"
            ? "एक लक्ष्य चुनें। हम बताएंगे कि हर महीने कितना SIP चाहिए।"
            : "Pick a goal. We tell you exactly how much SIP you need monthly, and whether FD or MF is better."}
        </p>
      </motion.div>

      {/* Saved Goals (if any) */}
      {user && savedGoals.length > 0 && !selectedGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-lg font-syne font-bold text-white mb-4 flex items-center gap-2">
            <Target size={20} className="text-[#1A56DB]" />{" "}
            {language === "hi" ? "मेरे लक्ष्य" : "My Goals"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedGoals.map((g) => {
              const prog =
                g.existing_savings > 0
                  ? Math.min(100, (g.existing_savings / g.target_amount) * 100)
                  : 0;
              return (
                <div
                  key={g.id}
                  className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] hover:border-[#1A56DB]/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{g.goal_emoji}</span>
                      <span className="text-white font-bold text-sm">
                        {g.goal_title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="text-[#64748B] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-[#F59E0B] font-mono font-bold text-lg">
                    {formatCurrency(g.target_amount)}
                  </div>
                  <div className="text-xs text-[#64748B] mb-3">
                    by{" "}
                    {new Date(g.target_date).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {prog > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
                        <span>{prog.toFixed(0)}% saved</span>
                        <span>
                          {formatCurrency(g.target_amount - g.existing_savings)}{" "}
                          remaining
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0F1E] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A56DB] rounded-full transition-all"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-[#94A3B8]">
                    SIP needed:{" "}
                    <span className="text-white font-mono font-bold">
                      {formatCurrency(g.monthly_sip)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Goal Selection Grid or Calculator */}
      <AnimatePresence mode="wait">
        {!selectedGoal ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-lg font-syne font-bold text-white mb-4">
              {language === "hi" ? "लक्ष्य चुनें" : "Choose a goal"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GOALS.map((g) => (
                <motion.button
                  key={g.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectGoal(g)}
                  className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] hover:border-opacity-100 transition-all text-left group"
                  style={{ borderColor: `${g.color}30` }}
                >
                  <span className="text-3xl block mb-3">{g.emoji}</span>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-[#F59E0B] transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-[#64748B] text-[11px] leading-snug">
                    {g.description}
                  </p>
                  <div className="mt-3 text-[10px] font-mono text-[#94A3B8]">
                    {formatCurrency(g.defaultAmount)} · {g.defaultHorizon}y
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedGoal(null);
                setSaveSuccess(false);
              }}
              className="flex items-center gap-1 text-[#64748B] hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft size={16} />{" "}
              {language === "hi" ? "सभी लक्ष्य" : "All Goals"}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{selectedGoal.emoji}</span>
              <div>
                <h2 className="text-2xl font-syne font-bold text-white">
                  {selectedGoal.title}
                </h2>
                <p className="text-[#64748B] text-sm">
                  {selectedGoal.description}
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="bg-[#112240] p-5 sm:p-6 rounded-2xl border border-[#1E3A5F] mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
                  {language === "hi" ? "लक्ष्य राशि" : "Goal Amount"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={targetAmount === 0 ? "" : targetAmount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTargetAmount(v === "" ? 0 : Number(v));
                    }}
                    onBlur={() => setTargetAmount(Math.max(1000, targetAmount))}
                    className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 pl-8 pr-4 text-white focus:border-[#1A56DB] outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
                  {language === "hi" ? "कितने वर्षों में" : "Years Away"}
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={yearsAway}
                  onChange={(e) => setYearsAway(Number(e.target.value))}
                  className="w-full accent-[#1A56DB] mt-2"
                />
                <div className="text-center text-white font-mono font-bold mt-1">
                  {yearsAway} {language === "hi" ? "वर्ष" : "years"}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
                  {language === "hi" ? "पहले से बचत" : "You Already Have"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={existingSavings === 0 ? "" : existingSavings}
                    onChange={(e) => {
                      const v = e.target.value;
                      setExistingSavings(v === "" ? 0 : Number(v));
                    }}
                    onBlur={() =>
                      setExistingSavings(Math.max(0, existingSavings))
                    }
                    className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 pl-8 pr-4 text-white focus:border-[#1A56DB] outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">
                  {language === "hi" ? "शेष आवश्यक" : "Remaining needed"}
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {formatCurrency(Math.max(0, targetAmount - existingSavings))}
                </div>
              </div>
            </div>

            {/* Primary result */}
            <div className="bg-gradient-to-r from-[#1A56DB]/20 to-[#0D1A2E] rounded-2xl p-6 sm:p-8 border border-[#1A56DB]/30 mb-8 text-center">
              <p className="text-[#94A3B8] text-sm mb-2">
                {language === "hi"
                  ? `${formatCurrency(targetAmount)} तक पहुँचने के लिए ${yearsAway} वर्षों में, आपको चाहिए:`
                  : `To reach ${formatCurrency(targetAmount)} in ${yearsAway} years, you need:`}
              </p>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#F59E0B] my-3">
                {formatCurrency(primarySIP)}
                <span className="text-lg text-[#94A3B8] font-bold">
                  {" "}
                  / month
                </span>
              </div>
              <p className="text-[#64748B] text-xs">
                at 12% expected return (balanced mutual fund)
              </p>
            </div>

            {/* 3 Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {scenarios.map((s, i) => (
                <div
                  key={i}
                  className="bg-[#0D1A2E] rounded-xl p-5 border border-[#1E3A5F] text-center"
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">
                    {formatCurrency(s.sip)}
                    <span className="text-xs text-[#64748B]">/mo</span>
                  </div>
                  <div className="text-xs text-[#64748B] space-y-0.5">
                    <div>Total invested: {formatCurrency(s.totalInvested)}</div>
                    <div>
                      Wealth gained:{" "}
                      <span className="text-[#10B981]">
                        +{formatCurrency(s.wealthGained)}
                      </span>
                    </div>
                    <div>Return: {s.rate}% p.a.</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] mb-8">
              <h3 className="text-white font-bold text-sm mb-2">
                {language === "hi" ? "💡 सिफारिश" : "💡 Recommendation"}
              </h3>
              <p className="text-[#94A3B8] text-sm">{recommendation}</p>
            </div>

            {/* Progress bar */}
            {existingSavings > 0 && (
              <div className="bg-[#0D1A2E] rounded-xl p-5 border border-[#1E3A5F] mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-sm">
                    {language === "hi"
                      ? `आप ${progressPct.toFixed(0)}% पर हैं`
                      : `You're ${progressPct.toFixed(0)}% of the way there`}
                  </span>
                  <span className="text-[#64748B] text-xs font-mono">
                    {formatCurrency(
                      Math.max(0, targetAmount - existingSavings),
                    )}{" "}
                    more needed
                  </span>
                </div>
                <div className="w-full h-3 bg-[#0A0F1E] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${selectedGoal.color}, #F59E0B)`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10">
              <button
                onClick={handleSaveGoal}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-[#1A56DB]/80 transition-all disabled:opacity-50 shadow-lg shadow-[#1A56DB]/20"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving
                  ? language === "hi"
                    ? "सेव हो रहा है..."
                    : "Saving..."
                  : language === "hi"
                    ? "लक्ष्य सेव करें"
                    : "Save Goal"}
              </button>
              {saveSuccess && (
                <span className="text-[#10B981] text-sm font-bold">
                  ✓ {language === "hi" ? "लक्ष्य सेव हो गया!" : "Goal saved!"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SEBIBanner />
    </motion.div>
  );
}

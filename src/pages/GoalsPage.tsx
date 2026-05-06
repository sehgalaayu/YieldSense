import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Loader2, Save, Target, Trash2 } from "lucide-react";
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
  defaultHorizon: number;
  recommendedInstrument: string;
  color: string;
  isEmergency?: boolean;
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

const GOALS: GoalTemplate[] = [
  {
    id: "emergency",
    emoji: "🆘",
    title: "Emergency Fund",
    description: "3-6 months of expenses, accessible anytime",
    defaultAmount: 300000,
    defaultHorizon: 1,
    recommendedInstrument: "Liquid Fund",
    color: "#3B82F6",
    isEmergency: true,
  },
  {
    id: "vacation",
    emoji: "✈️",
    title: "Dream Vacation",
    description: "That trip to Europe or Japan",
    defaultAmount: 200000,
    defaultHorizon: 2,
    recommendedInstrument: "FD",
    color: "#8B5CF6",
  },
  {
    id: "car",
    emoji: "🚗",
    title: "Buy a Car",
    description: "Down payment or full purchase",
    defaultAmount: 500000,
    defaultHorizon: 3,
    recommendedInstrument: "MF",
    color: "#F59E0B",
  },
  {
    id: "wedding",
    emoji: "💍",
    title: "Wedding Fund",
    description: "Your big day, planned in advance",
    defaultAmount: 1500000,
    defaultHorizon: 5,
    recommendedInstrument: "MF",
    color: "#EC4899",
  },
  {
    id: "house",
    emoji: "🏠",
    title: "Home Down Payment",
    description: "20% down on your dream home",
    defaultAmount: 2000000,
    defaultHorizon: 7,
    recommendedInstrument: "MF",
    color: "#10B981",
  },
  {
    id: "retirement",
    emoji: "🌴",
    title: "Retirement Corpus",
    description: "Financial freedom at your chosen age",
    defaultAmount: 10000000,
    defaultHorizon: 25,
    recommendedInstrument: "MF",
    color: "#F97316",
  },
  {
    id: "education",
    emoji: "🎓",
    title: "Child's Education",
    description: "College fund for your child",
    defaultAmount: 3000000,
    defaultHorizon: 15,
    recommendedInstrument: "MF",
    color: "#06B6D4",
  },
  {
    id: "custom",
    emoji: "🎯",
    title: "Custom Goal",
    description: "Set your own target",
    defaultAmount: 1000000,
    defaultHorizon: 5,
    recommendedInstrument: "MF",
    color: "#64748B",
  },
];

function calculateRequiredSIP(
  targetAmount: number,
  years: number,
  existingSavings: number,
  annualReturn: number,
) {
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

export default function GoalsPage() {
  const { user, setAuthModalOpen } = useAuthStore();
  const { language } = useUserStore();

  const [selectedGoal, setSelectedGoal] = useState<GoalTemplate | null>(null);
  const [savedGoals, setSavedGoals] = useState<SavedGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [targetAmount, setTargetAmount] = useState(100000);
  const [yearsAway, setYearsAway] = useState(5);
  const [existingSavings, setExistingSavings] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(50000);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSavedGoals((data || []) as SavedGoal[]);
        setLoading(false);
      });
  }, [user]);

  const selectGoal = (goal: GoalTemplate) => {
    setSelectedGoal(goal);
    setTargetAmount(goal.defaultAmount);
    setYearsAway(goal.defaultHorizon);
    setExistingSavings(0);
    setMonthlyExpenses(Math.max(10000, Math.round(goal.defaultAmount / 6)));
    setSaveSuccess(false);
  };

  const scenarios = useMemo(() => {
    if (!selectedGoal || selectedGoal.isEmergency) return [];

    return [
      {
        label: language === "hi" ? "सुरक्षित" : "Conservative",
        rate: 7,
        color: "#3B82F6",
      },
      {
        label: language === "hi" ? "संतुलित" : "Balanced",
        rate: 12,
        color: "#F59E0B",
      },
      {
        label: language === "hi" ? "आक्रामक" : "Aggressive",
        rate: 15,
        color: "#10B981",
      },
    ].map((scenario) => {
      const lowSIP = calculateRequiredSIP(
        targetAmount,
        yearsAway,
        existingSavings,
        scenario.rate + 2,
      );
      const highSIP = calculateRequiredSIP(
        targetAmount,
        yearsAway,
        existingSavings,
        Math.max(0, scenario.rate - 2),
      );
      const sip = calculateRequiredSIP(
        targetAmount,
        yearsAway,
        existingSavings,
        scenario.rate,
      );
      return {
        ...scenario,
        sip,
        lowSIP,
        highSIP,
      };
    });
  }, [existingSavings, language, selectedGoal, targetAmount, yearsAway]);

  const primaryScenario = scenarios[1];

  const recommendation = useMemo(() => {
    if (selectedGoal?.isEmergency) {
      return language === "hi"
        ? "आपातकालीन फंड को liquid fund या sweep FD में रखें. SIP कैलकुलेटर लागू नहीं होता."
        : "Keep the emergency fund in a liquid fund or sweep FD. SIP math does not apply here.";
    }

    if (yearsAway < 2) {
      return language === "hi"
        ? "कम समय के लिए FD सुरक्षा बेहतर है."
        : "For a short horizon, FD safety usually wins.";
    }

    if (yearsAway < 5) {
      return language === "hi"
        ? "सुरक्षा और growth के बीच balanced MF देखें."
        : "Use a balanced MF when you need some growth without full equity risk.";
    }

    return language === "hi"
      ? "लंबी अवधि के लिए equity-oriented MF अधिक उपयुक्त हो सकते हैं."
      : "For longer horizons, equity-oriented MFs usually fit better.";
  }, [language, selectedGoal, yearsAway]);

  const handleSaveGoal = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!selectedGoal) return;

    setSaving(true);
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + yearsAway);

    const monthlySip = selectedGoal.isEmergency ? 0 : primaryScenario?.sip || 0;
    const recommendedReturn = selectedGoal.isEmergency
      ? 0
      : primaryScenario?.rate || 12;
    const goalAmount = selectedGoal.isEmergency
      ? monthlyExpenses * 6
      : targetAmount;

    const { error } = await supabase.from("user_goals").insert({
      user_id: user.id,
      goal_type: selectedGoal.id,
      goal_emoji: selectedGoal.emoji,
      goal_title: selectedGoal.title,
      target_amount: goalAmount,
      target_date: targetDate.toISOString().split("T")[0],
      existing_savings: existingSavings,
      monthly_sip: monthlySip,
      recommended_return: recommendedReturn,
      instrument_recommendation: selectedGoal.isEmergency
        ? "Liquid Fund / Sweep FD"
        : selectedGoal.recommendedInstrument,
    });

    if (!error) {
      const { data } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSavedGoals((data || []) as SavedGoal[]);
      setSaveSuccess(true);
    }

    setSaving(false);
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from("user_goals").delete().eq("id", id);
    setSavedGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest mb-3">
          {language === "hi" ? "लक्ष्य-आधारित निवेश" : "Goal-Based Investing"}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-4 text-white tracking-tight">
          {language === "hi"
            ? "अपने वित्तीय लक्ष्य तक पहुँचें"
            : "Reach your financial goals"}
        </h1>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          {language === "hi"
            ? "एक लक्ष्य चुनें। हम emergency fund और बाकी लक्ष्यों को अलग करके दिखाते हैं."
            : "Pick a goal. We separate emergency funds from growth goals and show a realistic monthly plan."}
        </p>
      </motion.div>

      {user && savedGoals.length > 0 && !selectedGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={20} className="text-[#1A56DB]" />
            {language === "hi" ? "मेरे लक्ष्य" : "My Goals"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.goal_emoji}</span>
                    <span className="text-white font-bold text-sm">
                      {goal.goal_title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-[#64748B] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-[#F59E0B] font-mono font-bold text-lg">
                  {formatCurrency(goal.target_amount)}
                </div>
                <div className="text-xs text-[#64748B] mb-3">
                  {new Date(goal.target_date).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs text-[#94A3B8]">
                  {goal.monthly_sip > 0
                    ? `${language === "hi" ? "SIP" : "SIP"}: ${formatCurrency(goal.monthly_sip)}/mo`
                    : language === "hi"
                      ? "Liquid buffer goal"
                      : "Liquid buffer goal"}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGoal ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              {language === "hi" ? "लक्ष्य चुनें" : "Choose a goal"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GOALS.map((goal) => (
                <motion.button
                  key={goal.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectGoal(goal)}
                  className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] hover:border-opacity-100 transition-all text-left group"
                  style={{ borderColor: `${goal.color}30` }}
                >
                  <span className="text-3xl block mb-3">{goal.emoji}</span>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-[#F59E0B] transition-colors">
                    {goal.title}
                  </h3>
                  <p className="text-[#64748B] text-[11px] leading-snug">
                    {goal.description}
                  </p>
                  <div className="mt-3 text-[10px] font-mono text-[#94A3B8]">
                    {formatCurrency(goal.defaultAmount)} · {goal.defaultHorizon}
                    y
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
            <button
              onClick={() => {
                setSelectedGoal(null);
                setSaveSuccess(false);
              }}
              className="flex items-center gap-1 text-[#64748B] hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft size={16} />
              {language === "hi" ? "सभी लक्ष्य" : "All Goals"}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{selectedGoal.emoji}</span>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {selectedGoal.title}
                </h2>
                <p className="text-[#64748B] text-sm">
                  {selectedGoal.description}
                </p>
              </div>
            </div>

            {selectedGoal.isEmergency ? (
              <div className="bg-[#0D1A2E] rounded-2xl p-6 sm:p-8 border border-[#1A56DB]/30 mb-8 space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">
                    {language === "hi" ? "मासिक खर्च" : "Monthly expenses"}
                  </div>
                  <input
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) =>
                      setMonthlyExpenses(Number(e.target.value) || 0)
                    }
                    className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#0A0F1E] border border-white/5 p-4 text-center">
                    <div className="text-xs uppercase tracking-widest text-[#64748B] mb-2">
                      {language === "hi"
                        ? "अनुशंसित कोष"
                        : "Recommended corpus"}
                    </div>
                    <div className="text-3xl font-mono font-black text-[#F59E0B]">
                      {formatCurrency(monthlyExpenses * 6)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#0A0F1E] border border-white/5 p-4 text-center">
                    <div className="text-xs uppercase tracking-widest text-[#64748B] mb-2">
                      {language === "hi" ? "कहाँ रखें" : "Where to park it"}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {selectedGoal.recommendedInstrument}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#94A3B8]">{recommendation}</p>
              </div>
            ) : (
              <>
                <div className="bg-[#112240] p-5 sm:p-6 rounded-2xl border border-[#1E3A5F] mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">
                      {language === "hi" ? "लक्ष्य राशि" : "Goal Amount"}
                    </label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) =>
                        setTargetAmount(Number(e.target.value) || 0)
                      }
                      className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none font-mono"
                    />
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
                    <input
                      type="number"
                      value={existingSavings}
                      onChange={(e) =>
                        setExistingSavings(Number(e.target.value) || 0)
                      }
                      className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">
                      {language === "hi" ? "शेष आवश्यक" : "Remaining needed"}
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">
                      {formatCurrency(
                        Math.max(0, targetAmount - existingSavings),
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#1A56DB]/20 to-[#0D1A2E] rounded-2xl p-6 sm:p-8 border border-[#1A56DB]/30 mb-8 text-center">
                  <p className="text-[#94A3B8] text-sm mb-2">
                    {language === "hi"
                      ? `${formatCurrency(targetAmount)} तक पहुँचने के लिए ${yearsAway} वर्षों में, आपको चाहिए:`
                      : `To reach ${formatCurrency(targetAmount)} in ${yearsAway} years, you need:`}
                  </p>
                  <div className="text-4xl sm:text-5xl font-mono font-black text-[#F59E0B] my-3">
                    {formatCurrency(primaryScenario?.sip || 0)}
                    <span className="text-lg text-[#94A3B8] font-bold">
                      {" "}
                      / month
                    </span>
                  </div>
                  {primaryScenario && (
                    <p className="text-[#64748B] text-xs">
                      {language === "hi"
                        ? `Balanced MF range: ${formatCurrency(primaryScenario.lowSIP)} - ${formatCurrency(primaryScenario.highSIP)}/mo.`
                        : `Balanced MF range: ${formatCurrency(primaryScenario.lowSIP)} - ${formatCurrency(primaryScenario.highSIP)}/mo.`}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.label}
                      className="bg-[#0D1A2E] rounded-xl p-5 border border-[#1E3A5F] text-center"
                    >
                      <div
                        className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ color: scenario.color }}
                      >
                        {scenario.label}
                      </div>
                      <div className="text-2xl font-mono font-bold text-white mb-1">
                        {formatCurrency(scenario.sip)}
                        <span className="text-xs text-[#64748B]">/mo</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-2">
                        {formatCurrency(scenario.lowSIP)} -{" "}
                        {formatCurrency(scenario.highSIP)}/mo
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] mb-8">
                  <h3 className="text-white font-bold text-sm mb-2">
                    {language === "hi" ? "💡 सिफारिश" : "💡 Recommendation"}
                  </h3>
                  <p className="text-[#94A3B8] text-sm">{recommendation}</p>
                </div>
              </>
            )}

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

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentNAV } from "../lib/amfiApi";
import { useUserStore } from "../store/userStore";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "motion/react";
import Toast from "../components/Toast";
import { translations } from "../lib/translations";
import { SEBIBanner } from "../components/SEBIDisclaimer";
import AuthGate from "../components/AuthGate";
import { calculatePortfolioScore } from "../lib/portfolioScore";
import { getComparisonHistory } from "../lib/amfiHistory";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Share2,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  List,
  BookmarkPlus,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const FundNAVChart = ({ result }: { result: any }) => {
  const [navHistory, setNavHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNAVHistory = async () => {
      setLoading(true);
      const history = await getComparisonHistory(
        result.regularFund.schemeCode,
        result.directFund.schemeCode,
      );
      setNavHistory(history);
      setLoading(false);
    };
    loadNAVHistory();
  }, [result]);

  if (loading)
    return (
      <div className="h-48 bg-[#0A0F1E]/50 rounded-xl animate-pulse mb-6" />
    );
  if (!navHistory) return null;

  return (
    <div className="mt-8 mb-6 p-4 bg-[#0A0F1E] rounded-2xl border border-[#1E3A5F]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">
            1-Year NAV Comparison
          </p>
          <p className="text-[10px] text-[#64748B]">Real-time data from AMFI</p>
        </div>
        {navHistory.performanceDiff > 0 && (
          <div className="bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
            <span className="text-[10px] text-green-400 font-bold uppercase">
              Direct outperformed by +{navHistory.performanceDiff}%
            </span>
          </div>
        )}
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <XAxis
              dataKey="dateFormatted"
              data={navHistory.direct}
              tick={{ fontSize: 9, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              interval={60}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#112240",
                border: "1px solid #1E3A5F",
                borderRadius: "12px",
                fontSize: "11px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
              formatter={(value: any) => [`₹${value.toFixed(2)}`, ""]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "10px", paddingBottom: "10px" }}
            />
            <Line
              data={navHistory.regular}
              type="monotone"
              dataKey="nav"
              name="Regular Plan"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              animationDuration={2000}
            />
            <Line
              data={navHistory.direct}
              type="monotone"
              dataKey="nav"
              name="Direct Plan"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-[#64748B] text-center mt-2 italic">
        Historical returns are not a guarantee of future performance. Expense
        ratio savings are guaranteed.
      </p>
    </div>
  );
};

export default function MFResultsPage() {
  const navigate = useNavigate();
  const {
    mfAnalysisResults,
    language,
    navCache,
    setNavCache,
    riskTolerance,
    mfHoldings,
  } = useUserStore();
  const { user, setAuthModalOpen } = useAuthStore();
  const t = translations[language].mfResults;
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [navLoading, setNavLoading] = useState<Record<string, boolean>>({});

  // Share state
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [watchlistToast, setWatchlistToast] = useState<string | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState<string | null>(null);

  const toggleWatchlist = async (fund: any) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const schemeCode = fund.schemeCode || fund.id;
    setWatchlistLoading(schemeCode);
    try {
      const { data: existing } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .eq("scheme_code", schemeCode)
        .maybeSingle();

      if (existing) {
        await supabase.from("watchlist").delete().eq("id", existing.id);
        setWatchlistToast("Removed from Watchlist");
        setTimeout(() => setWatchlistToast(null), 3000);
      } else {
        await supabase.from("watchlist").insert({
          user_id: user.id,
          fund_id: schemeCode,
          scheme_code: schemeCode,
          fund_name: fund.schemeName || fund.shortName || fund.name,
          category: fund.category || "Mutual Fund",
          last_nav: fund.nav || 0,
        });
        setWatchlistToast("Added to Watchlist");
        setTimeout(() => setWatchlistToast(null), 3000);
      }
    } catch (err) {
      console.error("Watchlist error:", err);
    } finally {
      setWatchlistLoading(null);
    }
  };

  useEffect(() => {
    if (mfAnalysisResults.length === 0) {
      navigate("/mf/analyze");
    } else {
      mfAnalysisResults.forEach((result) => {
        const { regularFund, directFund } = result;
        [regularFund, directFund].forEach((fund) => {
          if (
            fund &&
            fund.schemeCode &&
            !navCache[fund.schemeCode] &&
            !navLoading[fund.schemeCode]
          ) {
            setNavLoading((prev) => ({ ...prev, [fund.schemeCode]: true }));
            fetchCurrentNAV(fund.schemeCode).then((nav) => {
              if (nav) setNavCache(fund.schemeCode, nav);
              setNavLoading((prev) => ({ ...prev, [fund.schemeCode]: false }));
            });
          }
        });
      });
    }
  }, [mfAnalysisResults, navigate]);

  if (mfAnalysisResults.length === 0) return null;

  const totalAnnualCost = mfAnalysisResults.reduce(
    (acc, curr) => acc + curr.analysis.regularFund.annualCostRs,
    0,
  );
  const totalAnnualSaving = mfAnalysisResults.reduce(
    (acc, curr) => acc + curr.analysis.annualSavingRs,
    0,
  );
  const total10YSaving = mfAnalysisResults.reduce(
    (acc, curr) => acc + curr.analysis.savingOver10Y,
    0,
  );

  const avgRegularExp =
    mfAnalysisResults.reduce(
      (acc, curr) => acc + curr.analysis.regularFund.expenseRatio,
      0,
    ) / mfAnalysisResults.length;
  const avgDirectExp =
    mfAnalysisResults.reduce(
      (acc, curr) => acc + curr.analysis.directFund.expenseRatio,
      0,
    ) / mfAnalysisResults.length;

  const score = useMemo(() => {
    return calculatePortfolioScore(
      mfHoldings,
      mfAnalysisResults,
      riskTolerance,
    );
  }, [mfHoldings, mfAnalysisResults, riskTolerance]);

  const priorityQueue = useMemo(() => {
    return [...mfAnalysisResults]
      .filter((r) => r.analysis.shouldSwitch)
      .sort((a, b) => {
        const urgencyOrder: Record<string, number> = {
          High: 3,
          Medium: 2,
          Low: 1,
        };
        const urgencyDiff =
          urgencyOrder[b.analysis.switchUrgency] -
          urgencyOrder[a.analysis.switchUrgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return b.analysis.savingOver10Y - a.analysis.savingOver10Y;
      });
  }, [mfAnalysisResults]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToFund = (fundId: string) => {
    const element = document.getElementById(`fund-${fundId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setExpandedCards((prev) => ({ ...prev, [fundId]: true }));
    }
  };

  const handleAskAI = (prompt: string) => {
    const event = new CustomEvent("open-ai-chat", { detail: { prompt } });
    window.dispatchEvent(event);
  };

  const handleShare = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setShareLoading(true);

    try {
      const { data, error } = await supabase
        .from("shared_analyses")
        .insert({
          user_id: user.id,
          analysis_data: mfAnalysisResults,
          total_annual_saving: totalAnnualSaving,
          total_10y_saving: total10YSaving,
          fund_count: mfAnalysisResults.length,
          portfolio_score: score.totalScore,
        })
        .select("share_token")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/mf/shared/${data.share_token}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 5000);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pt-24 pb-32"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            {t.title}
          </h1>
          <SEBIBanner />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-xs text-red-400 uppercase tracking-wider mb-1">
                {t.totalDrain}
              </div>
              <div className="text-2xl font-mono text-red-400 font-bold">
                ₹{totalAnnualCost.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-xs text-green-400 uppercase tracking-wider mb-1">
                {t.yearlyLoss}
              </div>
              <div className="text-2xl font-mono text-green-400 font-bold">
                ₹{totalAnnualSaving.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="text-xs text-[#F59E0B] uppercase tracking-wider mb-1 font-bold">
                {t.next10Years}
              </div>
              <div className="text-3xl font-mono text-[#F59E0B] font-bold">
                ₹{total10YSaving.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </motion.div>

        {/* PORTFOLIO HEALTH SCORE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#1E3A5F] bg-[#0D1A2E] p-6 mb-6 overflow-hidden relative"
        >
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: score.gradeColor }}
          />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Score circle */}
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1E3A5F"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={score.gradeColor}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - score.totalScore / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-mono font-bold text-2xl"
                    style={{ color: score.gradeColor }}
                  >
                    {score.totalScore}
                  </span>
                  <span className="text-[10px] text-[#64748B]">/ 100</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-3xl font-black font-heading"
                    style={{ color: score.gradeColor }}
                  >
                    Grade {score.grade}
                  </span>
                </div>
                <p className="text-[#F1F5F9] font-medium">
                  Portfolio Health Score
                </p>
                <p className="text-[#64748B] text-sm mt-1">{score.topAction}</p>
              </div>
            </div>

            {/* Right: Score breakdown bars */}
            <div className="hidden md:block space-y-2 min-w-[220px]">
              {[
                {
                  label: "Expense Ratio",
                  score: score.components.expenseRatioScore,
                  max: 30,
                },
                {
                  label: "Direct Plans",
                  score: score.components.directVsRegularScore,
                  max: 30,
                },
                {
                  label: "Diversification",
                  score: score.components.diversificationScore,
                  max: 20,
                },
                {
                  label: "Risk Alignment",
                  score: score.components.riskAlignmentScore,
                  max: 20,
                },
              ].map(({ label, score: s, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#64748B] uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-[#F1F5F9] font-mono">
                      {s}/{max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1E3A5F] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(s / max) * 100}%`,
                        backgroundColor:
                          s / max >= 0.7
                            ? "#10B981"
                            : s / max >= 0.4
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights strip */}
          <div className="mt-6 pt-4 border-t border-[#1E3A5F]">
            <p className="text-xs text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle size={12} className="text-[#F59E0B]" />
              Key Insights
            </p>
            <div className="space-y-2">
              {score.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#F59E0B] text-xs mt-0.5 flex-shrink-0">
                    →
                  </span>
                  <p className="text-[#94A3B8] text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* SWITCH PRIORITY QUEUE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-5 mb-10 shadow-xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[#F1F5F9] font-semibold flex items-center gap-2">
                <List size={18} className="text-[#F59E0B]" />
                Switch Priority Queue
              </h3>
              <p className="text-[#64748B] text-sm mt-0.5">
                Optimize these funds in order for maximum impact
              </p>
            </div>
            <span className="text-[10px] font-bold font-mono bg-[#112240] text-[#F59E0B] px-2 py-1 rounded border border-[#1E3A5F] uppercase tracking-wider">
              {priorityQueue.length} recommendations
            </span>
          </div>

          <div className="space-y-3">
            {priorityQueue.map((result, index) => {
              const saving = result.analysis.savingOver10Y;
              const urgencyColors: Record<string, any> = {
                High: {
                  bg: "bg-red-500/5",
                  border: "border-red-500/20",
                  text: "text-red-400",
                },
                Medium: {
                  bg: "bg-amber-500/5",
                  border: "border-amber-500/20",
                  text: "text-amber-400",
                },
                Low: {
                  bg: "bg-blue-500/5",
                  border: "border-blue-500/20",
                  text: "text-blue-400",
                },
              };
              const colors =
                urgencyColors[result.analysis.switchUrgency] ||
                urgencyColors.Medium;

              return (
                <motion.div
                  key={result.holding.fundId}
                  whileHover={{ x: 4 }}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors 
                    ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Priority number */}
                    <div className="w-8 h-8 rounded-full bg-[#0A0F1E] border border-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold font-mono text-[#F1F5F9]">
                        {index + 1}
                      </span>
                    </div>

                    {/* Fund info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F1F5F9] text-sm font-bold truncate">
                        {result.regularFund.name}
                      </p>
                      <p className="text-[#64748B] text-xs flex items-center gap-1">
                        Save{" "}
                        <span className="text-green-400 font-bold">
                          ₹{saving.toLocaleString("en-IN")}
                        </span>{" "}
                        over 10 years
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10">
                    {/* Urgency + saving */}
                    <div className="text-left sm:text-right flex-shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}
                      >
                        {result.analysis.switchUrgency} PRIORITY
                      </span>
                      <p className="text-[#64748B] text-[10px] mt-0.5 uppercase tracking-tighter">
                        ₹
                        {result.analysis.annualSavingRs.toLocaleString("en-IN")}
                        /yr loss
                      </p>
                    </div>

                    {/* Quick switch button */}
                    <button
                      onClick={() => scrollToFund(result.holding.fundId)}
                      className="px-4 py-2 bg-[#F59E0B] text-black text-xs 
                        font-bold rounded-lg flex-shrink-0 hover:bg-[#D97706] 
                        transition-all shadow-md active:scale-95"
                    >
                      Optimize →
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {priorityQueue.length === 0 && (
              <div className="text-center py-10 bg-[#0A0F1E]/50 rounded-xl border border-dashed border-[#1E3A5F]">
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-[#F1F5F9] font-bold">
                  Your portfolio is perfectly optimized!
                </p>
                <p className="text-[#64748B] text-sm mt-1 max-w-xs mx-auto">
                  All your funds are either Direct plans or the switching cost
                  outweighs the benefits.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Share toast */}
        <Toast
          open={shareSuccess}
          message={"Analysis Link Copied!"}
          type="success"
          duration={5000}
          position="bottom-center"
          onClose={() => setShareSuccess(false)}
          actionLabel="WhatsApp"
          onAction={() => {
            const message = `I just analyzed my Mutual Fund portfolio on WealthSense and I'm saving ₹${total10YSaving.toLocaleString("en-IN")}! Check yours: ${shareUrl}`;
            window.open(
              `https://wa.me/?text=${encodeURIComponent(message)}`,
              "_blank",
            );
          }}
        />

        {/* Watchlist toast */}
        <Toast
          open={!!watchlistToast}
          message={watchlistToast || ""}
          type="success"
          duration={3000}
          position="top-right"
          onClose={() => setWatchlistToast(null)}
        />

        {/* PER-FUND ANALYSIS */}
        <h3 className="text-xl font-semibold mb-4">
          {t.cards.fundDetails}
        </h3>
        <div className="space-y-4 mb-12">
          {mfAnalysisResults.map((result, idx) => {
            const isExpanded = expandedCards[result.holding.fundId] || false;
            const { analysis } = result;
            const isLocked = idx > 0 && !user;

            const cardContent = (
              <div
                id={`fund-${result.holding.fundId}`}
                className={`bg-[#112240] border ${analysis.shouldSwitch ? "border-green-500/30" : "border-[#1E3A5F]"} rounded-xl overflow-hidden transition-all duration-300`}
              >
                {/* Card Header (Always visible) */}
                <div
                  className="p-5 cursor-pointer hover:bg-[#1E3A5F]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  onClick={() => !isLocked && toggleCard(result.holding.fundId)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-lg">
                        {analysis.regularFund.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-[#0A0F1E] px-2 py-1 rounded text-[#94A3B8] border border-[#1E3A5F]">
                        {result.regularFund.category}
                      </span>
                      {analysis.switchUrgency === "High" && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 font-bold">
                          HIGH URGENCY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(result.regularFund);
                      }}
                      className="p-2.5 rounded-lg bg-[#0A0F1E] border border-[#1E3A5F] text-[#64748B] hover:text-accent-gold hover:border-accent-gold/30 transition-all flex items-center gap-2"
                      title="Add to Watchlist"
                    >
                      {watchlistLoading === result.regularFund.schemeCode ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <BookmarkPlus size={16} />
                          <span className="text-[10px] font-bold uppercase hidden sm:block">
                            Watch
                          </span>
                        </>
                      )}
                    </button>
                    <div className="flex flex-row sm:flex-col justify-between sm:items-end w-full sm:w-auto gap-2 sm:gap-1">
                      <div className="text-sm">
                        <span className="text-[#94A3B8]">
                          {t.cards.regExpense}:{" "}
                        </span>
                        <span className="text-red-400 font-mono">
                          ₹
                          {analysis.regularFund.annualCostRs.toLocaleString(
                            "en-IN",
                          )}
                          /yr
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#94A3B8]">
                          {t.cards.dirExpense}:{" "}
                        </span>
                        <span className="text-green-400 font-mono">
                          ₹
                          {analysis.directFund.annualCostRs.toLocaleString(
                            "en-IN",
                          )}
                          /yr
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Expanded Content */}
                {isExpanded && !isLocked && (
                  <div className="p-5 pt-0 border-t border-[#1E3A5F]">
                    {/* Comparison View */}
                    <div className="mt-4 mb-6">
                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-[#94A3B8] bg-[#0A0F1E] border-y border-[#1E3A5F]">
                            <tr>
                              <th className="px-4 py-3 font-medium">Metric</th>
                              <th className="px-4 py-3 font-medium">
                                Regular (Current)
                              </th>
                              <th className="px-4 py-3 font-medium">
                                Direct (Alternative)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[#1E3A5F]/50">
                              <td className="px-4 py-3 text-[#94A3B8]">
                                Expense Ratio
                              </td>
                              <td className="px-4 py-3 text-red-400 font-mono">
                                {analysis.regularFund.expenseRatio}%
                              </td>
                              <td className="px-4 py-3 text-green-400 font-mono">
                                {analysis.directFund.expenseRatio}%
                              </td>
                            </tr>
                            <tr className="border-b border-[#1E3A5F]/50">
                              <td className="px-4 py-3 text-[#94A3B8]">
                                Annual Fee (₹)
                              </td>
                              <td className="px-4 py-3 text-red-400 font-mono">
                                ₹
                                {analysis.regularFund.annualCostRs.toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td className="px-4 py-3 text-green-400 font-mono">
                                ₹
                                {analysis.directFund.annualCostRs.toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-[#94A3B8]">
                                10Y Projection
                              </td>
                              <td className="px-4 py-3">
                                ₹
                                {analysis.regularFund.projectedValue10Y.toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-green-400">
                                ₹
                                {analysis.directFund.projectedValue10Y.toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="sm:hidden space-y-4">
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-[#1E3A5F] flex justify-between items-center">
                          <span className="text-[#94A3B8] text-xs uppercase font-bold tracking-widest">
                            Expense Ratio
                          </span>
                          <div className="flex gap-4">
                            <span className="text-red-400 font-mono font-bold">
                              {analysis.regularFund.expenseRatio}%
                            </span>
                            <span className="text-green-400 font-mono font-bold">
                              {analysis.directFund.expenseRatio}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-[#1E3A5F] flex justify-between items-center">
                          <span className="text-[#94A3B8] text-xs uppercase font-bold tracking-widest">
                            Annual Fee
                          </span>
                          <div className="flex gap-4">
                            <span className="text-red-400 font-mono font-bold">
                              ₹
                              {analysis.regularFund.annualCostRs.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span className="text-green-400 font-mono font-bold">
                              ₹
                              {analysis.directFund.annualCostRs.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-accent-blue/30 flex justify-between items-center">
                          <span className="text-accent-blue text-xs uppercase font-bold tracking-widest">
                            10Y Projection
                          </span>
                          <div className="flex gap-4 text-right">
                            <span className="text-green-400 font-mono font-bold">
                              ₹
                              {analysis.directFund.projectedValue10Y.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* NAV HISTORY CHART */}
                    <FundNAVChart result={result} />

                    {/* Savings Impact Visual */}
                    <h5 className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wider">
                      Compound Savings Impact
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                      <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-[#94A3B8] mb-1">
                          5 Years
                        </div>
                        <div className="text-[#F59E0B] font-bold">
                          Save ₹{analysis.savingOver5Y.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-lg p-4 text-center transform scale-105 shadow-lg">
                        <div className="text-xs text-[#94A3B8] mb-1">
                          10 Years
                        </div>
                        <div className="text-[#F59E0B] font-bold text-lg">
                          Save ₹{analysis.savingOver10Y.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Box */}
                    <div
                      className={`border rounded-xl p-4 mb-6 ${analysis.shouldSwitch ? "border-green-500/50 bg-green-500/5" : "border-[#F59E0B]/50 bg-[#F59E0B]/5"}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">
                          {analysis.shouldSwitch ? "✅" : "⚠️"}
                        </span>
                        <h5
                          className={`font-bold ${analysis.shouldSwitch ? "text-green-400" : "text-[#F59E0B]"}`}
                        >
                          {analysis.shouldSwitch
                            ? "We recommend switching to Direct"
                            : "Hold before switching"}
                        </h5>
                      </div>
                      <p className="text-sm text-[#94A3B8]">
                        🏦 <strong>Note:</strong> {analysis.taxNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                key={idx}
              >
                {idx > 0 ? (
                  <AuthGate message="Sign in to unlock full analysis for all your funds">
                    {cardContent}
                  </AuthGate>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* AI ADVISOR STRIP */}
        <div className="bg-gradient-to-r from-[#112240] to-[#1A56DB]/20 border border-[#1A56DB]/50 rounded-2xl p-6 sm:p-8 mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center text-xs">
                AI
              </span>
              Ask WealthSense AI about your portfolio
            </h3>
            <p className="text-[#94A3B8] text-sm mb-4">
              Confused about taxes or exit loads? Ask our AI advisor for
              personalized guidance.
            </p>

            <div className="flex flex-col gap-2">
              {[
                "Should I switch all my Regular funds at once?",
                "Which of my funds should I switch first?",
                "What's the tax impact of switching these funds?",
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleAskAI(prompt)}
                  className="text-left text-sm p-3 rounded-lg bg-[#0A0F1E]/50 border border-[#1E3A5F] hover:border-[#1A56DB] hover:bg-[#1A56DB]/10 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() =>
                handleAskAI("Hello! Please review my mutual fund portfolio.")
              }
              className="px-6 py-3 bg-[#F1F5F9] text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg"
            >
              Open AI Chat
            </button>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (sticky on mobile) */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-[#0A0F1E] sm:bg-transparent border-t sm:border-0 border-[#1E3A5F] z-20 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/mf/analyze")}
            className="flex-1 py-3 bg-[#112240] border border-[#1E3A5F] rounded-xl font-medium hover:bg-[#1E3A5F] transition-colors"
          >
            {t.actions.addFunds}
          </button>
          <button
            disabled={shareLoading}
            onClick={handleShare}
            className="flex-1 py-3 bg-[#1A56DB] text-white rounded-xl font-medium hover:bg-[#1648C0] shadow-lg shadow-[#1A56DB]/20 transition-all flex items-center justify-center gap-2"
          >
            {shareLoading ? (
              "Generating link..."
            ) : (
              <>
                <Share2 size={18} />
                {t.actions.shareAnalysis}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

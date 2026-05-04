import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import {
  AlertCircle,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "../lib/calculator";

export default function SharedAnalysisPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchSharedData() {
      try {
        const { data: shared, error } = await supabase
          .from("shared_analyses")
          .select("*")
          .eq("share_token", token)
          .single();

        if (error || !shared) {
          setError("Analysis not found or link expired.");
          return;
        }

        // Check expiry
        const expiresAt = new Date(shared.expires_at);
        if (new Date() > expiresAt) {
          setError("This sharing link has expired.");
          return;
        }

        // Normalize stored row into the shape this page expects
        const scoreObj = {
          totalScore: shared.portfolio_score || 0,
          grade:
            (shared.portfolio_score || 0) >= 80
              ? "A"
              : (shared.portfolio_score || 0) >= 60
                ? "B"
                : (shared.portfolio_score || 0) >= 40
                  ? "C"
                  : "D",
          gradeColor:
            (shared.portfolio_score || 0) >= 80
              ? "#10B981"
              : (shared.portfolio_score || 0) >= 60
                ? "#1A56DB"
                : (shared.portfolio_score || 0) >= 40
                  ? "#F59E0B"
                  : "#EF4444",
          insights: [
            "Snapshot generated from user-provided holdings",
            "Recommendations are read-only and illustrative",
          ],
        };

        setData({
          score: scoreObj,
          results: shared.analysis_data || [],
          total10YSaving:
            shared.total_10y_saving || shared.total10y_saving || 0,
        });
      } catch (err) {
        setError("Failed to load shared analysis.");
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6">
        <Loader2 className="text-[#1A56DB] animate-spin mb-4" size={40} />
        <p className="text-[#64748B] font-syne font-bold animate-pulse">
          Decrypting Analysis Snapshot...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="text-red-400" size={32} />
        </div>
        <h1 className="text-2xl font-syne font-bold text-[#F1F5F9] mb-2">
          Link Invalid
        </h1>
        <p className="text-[#64748B] max-w-sm mb-8">{error}</p>
        <button
          onClick={() => navigate("/mf")}
          className="px-6 py-3 bg-[#1A56DB] text-white rounded-xl font-bold hover:bg-[#1648C0] transition-all"
        >
          Analyze Your Own Portfolio
        </button>
      </div>
    );
  }

  const { score, results, total10YSaving } = data;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A56DB] to-[#7C3AED] py-2 px-4 text-center">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
          Viewing a shared portfolio analysis snapshot · Read Only
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <button
          onClick={() => navigate("/mf")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#F1F5F9] transition-all mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-bold uppercase tracking-widest">
            Back to WealthSense
          </span>
        </button>

        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-syne font-black mb-4 leading-tight">
            Portfolio{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">
              Analysis Report
            </span>
          </h1>
          <p className="text-[#64748B] max-w-2xl mx-auto">
            This snapshot shows how switching to Direct Mutual Fund plans could
            optimize this portfolio.
          </p>
        </header>

        {/* HEALTH SCORE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#1E3A5F] bg-[#0D1A2E] p-8 mb-8 overflow-hidden relative shadow-2xl"
        >
          <div
            className="absolute top-0 left-0 w-full h-2"
            style={{ backgroundColor: score.gradeColor }}
          />

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#1E3A5F"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={score.gradeColor}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - score.totalScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-mono font-black text-5xl"
                  style={{ color: score.gradeColor }}
                >
                  {score.totalScore}
                </span>
                <span className="text-xs text-[#64748B] font-bold uppercase tracking-tighter">
                  Score
                </span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div
                className="inline-block px-4 py-1 rounded-full mb-4 border border-[#1E3A5F] bg-[#112240]"
                style={{ color: score.gradeColor }}
              >
                <span className="text-sm font-black uppercase tracking-widest">
                  Grade {score.grade} Portfolio
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-4">
                Potential 10-Year Savings:{" "}
                <span className="text-green-400">
                  ₹{total10YSaving.toLocaleString("en-IN")}
                </span>
              </h2>
              <div className="space-y-2">
                {score.insights
                  .slice(0, 2)
                  .map((insight: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 justify-center md:justify-start"
                    >
                      <ShieldCheck
                        className="text-accent-gold flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACTION ITEMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#112240] border border-[#1E3A5F] p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-accent-blue" size={20} />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Wealth Gain Impact
              </h3>
            </div>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
              By eliminating high commissions (up to 1.5% p.a.), this portfolio
              can compound significantly faster.
            </p>
            <div className="text-2xl font-mono font-bold text-accent-blue">
              +₹{total10YSaving.toLocaleString("en-IN")} Extra Wealth
            </div>
          </div>

          <div className="bg-[#112240] border border-[#1E3A5F] p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="text-accent-gold" size={20} />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Transparency Check
              </h3>
            </div>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
              Direct plans have the same underlying assets as regular plans but
              zero distributor commission.
            </p>
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <ShieldCheck size={18} />
              <span>SEBI Regulated Savings</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#112240] to-[#0A0F1E] border border-[#1E3A5F] p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#1A56DB]/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#7C3AED]/10 blur-3xl rounded-full" />

          <h3 className="text-2xl font-syne font-bold mb-4 relative z-10">
            Check Your Own Portfolio Performance
          </h3>
          <p className="text-[#64748B] mb-8 max-w-md mx-auto relative z-10">
            Join 10,000+ investors who use WealthSense to detect hidden
            commissions and switch to Direct plans.
          </p>
          <button
            onClick={() => navigate("/mf")}
            className="px-10 py-4 bg-[#1A56DB] text-white rounded-xl font-black text-lg hover:bg-[#1648C0] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#1A56DB]/20 relative z-10"
          >
            Analyze My Portfolio FREE →
          </button>
        </div>

        <p className="text-center text-[10px] text-[#64748B] mt-12 uppercase tracking-widest font-bold">
          Empowering Retail Investors · Built on AMFI Open Data
        </p>
      </div>
    </div>
  );
}

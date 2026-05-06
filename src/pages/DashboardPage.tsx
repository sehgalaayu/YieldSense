import { useUserStore } from "../store/userStore";
import { useAuthStore } from "../store/authStore";
import { formatCurrency, calculateYield } from "../lib/calculator";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Calendar,
  ArrowRight,
  ExternalLink,
  Eye,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";

import { translations } from "../lib/translations";
import { supabase } from "../lib/supabase";
import AuthGate from "../components/AuthGate";

const COLORS = ["#1A56DB", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

type DashboardBooking = {
  id?: string;
  bank_name: string;
  amount: number;
  tenor_months: number;
  gross_rate: number;
  maturity_date: string;
  maturity_amount?: number;
  bankName?: string;
  tenor?: number;
  date?: string;
};

type WatchlistItem = {
  id: string;
  fund_name: string;
  category?: string;
  last_nav?: number;
};

type DailyMetric = {
  label: string;
  value: string;
};

type DailyPulse = {
  eyebrow: string;
  headline: string;
  summary: string;
  accent: string;
  metrics: DailyMetric[];
};

const DAY_MS = 1000 * 60 * 60 * 24;

function getDaysToMaturity(maturityDate: string) {
  const parsed = new Date(maturityDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - Date.now()) / DAY_MS);
}

function getMaturityStatus(daysToMaturity: number | null) {
  if (daysToMaturity === null) return { label: "Unknown", tone: "muted" };
  if (daysToMaturity <= 0) return { label: "Matured", tone: "danger" };
  if (daysToMaturity <= 7) return { label: "Due soon", tone: "warning" };
  return { label: `${daysToMaturity}d left`, tone: "success" };
}

export default function DashboardPage() {
  const { bookedFDs, taxSlab, language } = useUserStore();
  const { user } = useAuthStore();
  const t = translations[language].dashboard;
  const [dbBookings, setDbBookings] = useState<DashboardBooking[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        setWatchlistLoading(false);
        return;
      }

      try {
        // Load FD Bookings
        const { data: fdData } = await supabase
          .from("fd_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setDbBookings((fdData || []) as DashboardBooking[]);

        // Load Watchlist
        const { data: wlData } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setWatchlist((wlData || []) as WatchlistItem[]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
        setWatchlistLoading(false);
      }
    };

    loadData();
  }, [user]);

  const removeFromWatchlist = async (id: string) => {
    try {
      await supabase.from("watchlist").delete().eq("id", id);
      setWatchlist((prev: WatchlistItem[]) =>
        prev.filter((item) => item.id !== id),
      );
    } catch (err) {
      console.error("Error removing from watchlist:", err);
    }
  };

  const openDailyBrief = () => {
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: {
          prompt:
            language === "hi"
              ? "मेरे पोर्टफोलियो का आज का 3-बिंदु ब्रीफ और अगला सबसे अच्छा कदम बताइए।"
              : "Give me today's 3-point portfolio brief and the best next step.",
        },
      }),
    );
  };

  const openReinvestAdvisor = () => {
    const nextBooking = maturityQueue[0];
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: {
          prompt: nextBooking
            ? `My FD in ${nextBooking.bank_name} matures in ${nextBooking.daysToMaturity <= 0 ? "today" : `${nextBooking.daysToMaturity} days`}. Should I reinvest, split, or move to debt mutual funds? Principal is ${formatCurrency(nextBooking.amount)} and maturity value is ${formatCurrency(nextBooking.maturityAmount)}.`
            : "Suggest a smart reinvestment plan for my fixed deposits and compare reinvesting versus debt mutual funds.",
        },
      }),
    );
  };

  const localBookings = useMemo<DashboardBooking[]>(() => {
    return bookedFDs.map((booking, index) => {
      const bookingDate = new Date(booking.date || Date.now());
      const maturityDate = new Date(bookingDate);
      maturityDate.setMonth(maturityDate.getMonth() + booking.tenor);

      return {
        id: `local-${booking.fdId}-${index}`,
        bank_name: booking.bankName,
        amount: booking.amount,
        tenor_months: booking.tenor,
        gross_rate: booking.grossRate,
        maturity_date: booking.maturityDate || maturityDate.toISOString(),
        maturity_amount: booking.maturityAmount,
      };
    });
  }, [bookedFDs]);

  // Combine local and DB bookings, avoiding duplicates
  const allBookings = useMemo<DashboardBooking[]>(() => {
    const combined = [...dbBookings, ...localBookings];
    const seen = new Set<string>();

    return combined.filter((booking) => {
      const key = `${booking.bank_name || booking.bankName}-${booking.amount}-${booking.tenor_months || booking.tenor}-${booking.maturity_date || booking.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbBookings, localBookings]);

  const stats = useMemo(() => {
    const bookings = allBookings as DashboardBooking[];
    const totalPrincipal = allBookings.reduce<number>(
      (sum: number, b: DashboardBooking) => sum + (b.amount || 0),
      0,
    );
    const weightedRate =
      allBookings.reduce<number>(
        (sum: number, b: DashboardBooking) => sum + b.amount * b.gross_rate,
        0,
      ) / (totalPrincipal || 1);

    // Calculate total maturity value
    const totalMaturity = bookings.reduce<number>(
      (sum: number, b: DashboardBooking) => {
        const results = calculateYield({
          principal: b.amount,
          tenorMonths: b.tenor_months,
          grossRate: b.gross_rate,
          taxSlab: taxSlab,
          interestType: "Cumulative",
        });
        return sum + results.netMaturityAmount;
      },
      0,
    );

    return {
      totalPrincipal,
      weightedRate,
      totalMaturity,
      totalInterest: totalMaturity - totalPrincipal,
      count: allBookings.length,
    };
  }, [allBookings, taxSlab]);

  const chartData = useMemo(() => {
    const bookings = allBookings as DashboardBooking[];
    const banks: Record<string, number> = {};
    bookings.forEach((b: DashboardBooking) => {
      banks[b.bank_name] = (banks[b.bank_name] || 0) + b.amount;
    });
    return Object.entries(banks).map(([name, value]) => ({ name, value }));
  }, [allBookings]);

  const nextMaturity = useMemo(() => {
    const withDates = allBookings
      .map((booking: DashboardBooking) => {
        const maturityDate = new Date(booking.maturity_date);
        if (Number.isNaN(maturityDate.getTime())) return null;
        return { ...booking, maturityDate };
      })
      .filter(Boolean) as Array<any>;

    return (
      withDates.sort(
        (a, b) => a.maturityDate.getTime() - b.maturityDate.getTime(),
      )[0] || null
    );
  }, [allBookings]);

  const maturityQueue = useMemo(() => {
    return allBookings
      .map((booking) => {
        const daysToMaturity = getDaysToMaturity(booking.maturity_date);
        const maturityAmount =
          booking.maturity_amount ||
          calculateYield({
            principal: booking.amount,
            tenorMonths: booking.tenor_months,
            grossRate: booking.gross_rate,
            taxSlab,
            interestType: "Cumulative",
          }).netMaturityAmount;

        return {
          ...booking,
          daysToMaturity,
          maturityAmount,
          maturityStatus: getMaturityStatus(daysToMaturity),
        };
      })
      .sort((a, b) => (a.daysToMaturity ?? 9999) - (b.daysToMaturity ?? 9999));
  }, [allBookings, taxSlab]);

  const daysToMaturity = nextMaturity
    ? Math.ceil(
        (nextMaturity.maturityDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const dailyPulse = useMemo<DailyPulse>(() => {
    const safeDaysToMaturity =
      typeof daysToMaturity === "number" ? daysToMaturity : 0;

    if (allBookings.length === 0) {
      return {
        eyebrow: language === "hi" ? "दैनिक चेक-इन" : "Daily check-in",
        headline:
          language === "hi"
            ? "अपनी पहली FD या वॉचलिस्ट जोड़ें."
            : "Add your first FD or watchlist item.",
        summary:
          language === "hi"
            ? "तुलना करें, फिर AI से आज की योजना पूछें."
            : "Compare now, then ask AI for today’s plan.",
        accent: "#1A56DB",
        metrics: [
          {
            label: language === "hi" ? "वॉचलिस्ट" : "Watchlist",
            value: `${watchlist.length}`,
          },
          {
            label: language === "hi" ? "बुकिंग" : "Bookings",
            value: "0",
          },
          {
            label: language === "hi" ? "अगला कदम" : "Next step",
            value: language === "hi" ? "तुलना" : "Compare",
          },
        ],
      };
    }

    const renewalSoon =
      typeof daysToMaturity === "number" && daysToMaturity <= 30;
    const headline = nextMaturity
      ? language === "hi"
        ? `${nextMaturity.bank_name} ${safeDaysToMaturity <= 0 ? "आज परिपक्व होगी" : `${safeDaysToMaturity} दिन में परिपक्व होगी`}`
        : `${nextMaturity.bank_name} ${safeDaysToMaturity <= 0 ? "matures today" : `matures in ${safeDaysToMaturity} days`}`
      : language === "hi"
        ? "आज के लिए कोई नई परिपक्वता नहीं है."
        : "No maturity due today.";

    return {
      eyebrow: renewalSoon
        ? language === "hi"
          ? "रिन्यूअल अलर्ट"
          : "Renewal alert"
        : language === "hi"
          ? "आज का ब्रीफ"
          : "Today's brief",
      headline,
      summary: renewalSoon
        ? language === "hi"
          ? "रिन्यू करने से पहले टैक्स और रेट की तुलना करें."
          : "Compare taxes and rates before renewing."
        : language === "hi"
          ? "वॉचलिस्ट और रिटर्न्स पर नज़र रखें."
          : "Keep an eye on watchlist changes and return trends.",
      accent: renewalSoon ? "#F59E0B" : "#10B981",
      metrics: [
        {
          label: language === "hi" ? "वॉचलिस्ट" : "Watchlist",
          value: `${watchlist.length}`,
        },
        {
          label: language === "hi" ? "औसत दर" : "Avg rate",
          value: `${stats.weightedRate.toFixed(2)}%`,
        },
        {
          label: language === "hi" ? "अर्जित ब्याज" : "Interest",
          value: formatCurrency(stats.totalInterest),
        },
      ],
    };
  }, [
    allBookings.length,
    daysToMaturity,
    language,
    nextMaturity,
    stats.totalInterest,
    stats.weightedRate,
    watchlist.length,
  ]);

  return (
    <AuthGate message="Sign in to view your FD portfolio and track returns.">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">{t.title}</h1>
            <p className="text-text-muted">{t.subtitle}</p>
          </div>
          <Link to="/compare">
            <Button className="bg-accent-blue hover:bg-accent-blue/90 text-white px-8 py-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent-blue/20">
              {t.investMore} <ArrowRight size={20} />
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading your portfolio...</p>
          </div>
        ) : allBookings.length === 0 ? (
          <div className="bg-bg-secondary rounded-3xl p-12 text-center border border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="text-text-muted" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-4">No investments found</h2>
            <p className="text-text-muted max-w-md mx-auto mb-8">
              You haven't booked any Fixed Deposits yet. Start comparing now to
              find the best rates!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/compare">
                <Button className="bg-accent-gold text-black font-bold px-8 py-4 rounded-xl">
                  Compare FDs
                </Button>
              </Link>
              <button
                onClick={openDailyBrief}
                className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
              >
                Ask AI for a plan
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-2 bg-bg-secondary rounded-3xl border border-white/5 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: dailyPulse.accent }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-text-muted mb-1">
                        {dailyPulse.eyebrow}
                      </p>
                      <h3 className="text-2xl font-bold">
                        {dailyPulse.headline}
                      </h3>
                      <p className="text-text-muted text-sm mt-2">
                        {dailyPulse.summary}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={openDailyBrief}
                    className="bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl px-6 py-5 font-bold"
                  >
                    {language === "hi" ? "AI ब्रीफ खोलें" : "Open AI brief"}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dailyPulse.metrics.map((metric: DailyMetric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl bg-white/5 border border-white/5 p-4"
                    >
                      <div className="text-[10px] uppercase tracking-[0.3em] text-text-muted mb-2">
                        {metric.label}
                      </div>
                      <div className="text-2xl font-bold font-mono">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                {maturityQueue.length > 0 && (
                  <div className="px-6 pb-6">
                    <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.35em] text-text-muted mb-2">
                          {language === "hi"
                            ? "परिपक्वता ट्रैकर"
                            : "Maturity tracker"}
                        </div>
                        <div className="font-bold text-lg">
                          {maturityQueue[0].bank_name} ·{" "}
                          {maturityQueue[0].maturityStatus.label}
                        </div>
                        <div className="text-sm text-text-muted mt-1">
                          {maturityQueue[0].daysToMaturity !== null &&
                          maturityQueue[0].daysToMaturity <= 0
                            ? language === "hi"
                              ? "यह FD अब परिपक्व हो चुकी है."
                              : "This FD is ready to reinvest."
                            : language === "hi"
                              ? `${maturityQueue[0].daysToMaturity} दिनों में रिडीम/रिन्यू करें.`
                              : `${maturityQueue[0].daysToMaturity} days left to redeem or renew.`}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={openReinvestAdvisor}
                          className="bg-accent-gold text-black hover:bg-accent-gold/90 font-bold rounded-xl"
                        >
                          {language === "hi"
                            ? "रिन्वेस्ट सलाह"
                            : "Reinvest Now"}
                        </Button>
                        <Link
                          to="/compare-fd-mf"
                          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                          {language === "hi" ? "FD vs MF" : "FD vs MF?"}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6 flex flex-wrap gap-3">
                  <button
                    onClick={openDailyBrief}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Calendar size={16} />
                    {language === "hi" ? "आज का ब्रीफ" : "Today’s brief"}
                  </button>
                  <Link
                    to="/compare"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <ArrowRight size={16} />
                    {language === "hi" ? "FD तुलना" : "Review FDs"}
                  </Link>
                  <Link
                    to="/mf/analyze"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Eye size={16} />
                    {language === "hi" ? "MF देखें" : "Review funds"}
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-secondary rounded-3xl p-8 border border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-blue/20 transition-colors" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue">
                    <Wallet size={20} />
                  </div>
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                    {t.stats.totalValue}
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold">
                  {formatCurrency(stats.totalPrincipal)}
                </div>
                <div className="mt-4 flex items-center gap-2 text-accent-green text-sm">
                  <TrendingUp size={16} />
                  <span>{stats.weightedRate.toFixed(2)}% Avg. Returns</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-secondary rounded-3xl p-8 border border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-gold/20 transition-colors" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-accent-gold/20 rounded-xl flex items-center justify-center text-accent-gold">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                    {t.stats.interest}
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold text-accent-gold">
                  {formatCurrency(stats.totalInterest)}
                </div>
                <div className="mt-4 text-text-muted text-sm">
                  Estimated at maturity
                </div>
              </motion.div>

              {/* Bookings Table / Cards */}
              <div className="md:col-span-2 bg-bg-secondary rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold">{t.holdings.title}</h3>
                  <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-text-muted">
                    {stats.count} FD{stats.count > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-text-muted font-bold border-b border-white/5">
                        <th className="px-6 py-4">{t.holdings.bank}</th>
                        <th className="px-6 py-4">{t.holdings.amount}</th>
                        <th className="px-6 py-4">{t.holdings.rate}</th>
                        <th className="px-6 py-4">{t.holdings.maturity}</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allBookings.map((b, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold">{b.bank_name}</div>
                            <div className="text-[10px] text-text-muted">
                              {b.tenor_months} Months
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            {formatCurrency(b.amount)}
                          </td>
                          <td className="px-6 py-4 text-accent-green font-bold">
                            {b.gross_rate}%
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="text-sm">
                                {new Date(b.maturity_date).toLocaleDateString()}
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${getMaturityStatus(getDaysToMaturity(b.maturity_date)).tone === "danger" ? "text-red-400" : getMaturityStatus(getDaysToMaturity(b.maturity_date)).tone === "warning" ? "text-accent-gold" : "text-accent-green"}`}
                              >
                                {
                                  getMaturityStatus(
                                    getDaysToMaturity(b.maturity_date),
                                  ).label
                                }
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-text-muted hover:text-white transition-colors">
                              <ExternalLink size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-white/5">
                  {allBookings.map((b, i) => (
                    <div key={i} className="p-6 bg-white/[0.01]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-lg">{b.bank_name}</div>
                          <div className="text-xs text-text-muted">
                            {b.tenor_months} Months
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-accent-green font-bold text-lg">
                            {b.gross_rate}%
                          </div>
                          <div className="text-[10px] text-text-muted uppercase tracking-widest">
                            Returns
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-[10px] text-text-muted uppercase mb-1">
                            Amount
                          </div>
                          <div className="font-mono font-bold">
                            {formatCurrency(b.amount)}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-right">
                          <div className="text-[10px] text-text-muted uppercase mb-1">
                            Maturity Date
                          </div>
                          <div className="text-sm">
                            {new Date(b.maturity_date).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-accent-gold">
                            {
                              getMaturityStatus(
                                getDaysToMaturity(b.maturity_date),
                              ).label
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fund Watchlist Section */}
              <div
                id="watchlist"
                className="md:col-span-2 bg-bg-secondary rounded-3xl border border-white/5 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#112240]/30">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-accent-gold" />
                    <h3 className="font-bold">Fund Watchlist</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#0A0F1E] px-3 py-1 rounded-full text-accent-gold border border-accent-gold/20">
                    REAL-TIME TRACKING
                  </span>
                </div>

                <div className="p-6">
                  {watchlistLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2
                        className="animate-spin text-accent-blue"
                        size={20}
                      />
                    </div>
                  ) : watchlist.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="text-[#64748B]" size={24} />
                      </div>
                      <p className="text-text-muted text-sm">
                        Your watchlist is empty.
                      </p>
                      <Link
                        to="/mf/analyze"
                        className="text-accent-blue text-xs font-bold uppercase tracking-widest mt-2 block hover:underline"
                      >
                        Search Funds to Watch →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {watchlist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-[#0A0F1E] rounded-2xl border border-[#1E3A5F]/50 group hover:border-accent-blue/30 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#F1F5F9] text-sm truncate">
                              {item.fund_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                                {item.category}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-[#1E3A5F]" />
                              <span className="text-[10px] text-accent-green font-bold">
                                NAV: ₹{item.last_nav?.toFixed(2) || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Link
                              to="/mf/analyze"
                              className="text-xs font-bold text-accent-blue hover:underline hidden sm:block"
                            >
                              Analyze
                            </Link>
                            <button
                              onClick={() => removeFromWatchlist(item.id)}
                              className="p-2 text-[#64748B] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Allocation Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-bg-secondary rounded-3xl p-8 border border-white/5 flex flex-col"
            >
              <h3 className="font-bold mb-8 text-center">
                {t.allocation.title}
              </h3>
              <div className="h-[250px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#112240",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm text-text-muted">{d.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {((d.value / stats.totalPrincipal) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}

import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import { getFDRates, getFilteredFDs, FDProduct } from "../lib/fdService";
import { getRecommendations } from "../lib/recommendations";
import { calculateYield, formatCurrency } from "../lib/calculator";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ShieldCheck, Info, Filter, Award } from "lucide-react";
import { motion } from "motion/react";
import BookingModal from "../components/BookingModal";
import { translations } from "../lib/translations";
import { SEBIBanner } from "../components/SEBIDisclaimer";

export default function ComparePage() {
  const profile = useUserStore();
  const t = translations[profile.language].compare;
  const [filteredProducts, setFilteredProducts] = useState<FDProduct[]>([]);
  const [fdData, setFdData] = useState<FDProduct[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "BestYield" | "Safest" | "ShortTerm" | "LongTerm"
  >("BestYield");

  const [bookingState, setBookingState] = useState<{
    isOpen: boolean;
    fd: any | null;
  }>({
    isOpen: false,
    fd: null,
  });

  useEffect(() => {
    const loadFDs = async () => {
      setLoading(true);
      const fds = await getFilteredFDs(
        activeFilter,
        profile.principal,
        profile.taxSlab as any,
        profile.tenorMonths,
      );
      setFilteredProducts(fds);
      setLastUpdated(fds[0]?.lastUpdated || "April 2026");
      setLoading(false);
    };
    loadFDs();
  }, [activeFilter, profile.principal, profile.taxSlab, profile.tenorMonths]);

  const handleBook = (fd: any) => {
    setBookingState({
      isOpen: true,
      fd,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <SEBIBanner />
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-12 text-center md:text-left">
        <div className="w-full md:w-auto mx-auto md:mx-0">
          <h1 className="text-4xl font-syne font-bold mb-4">{t.title}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <Badge
              variant="secondary"
              className="bg-bg-tertiary text-accent-blue border-border-subtle font-mono"
            >
              ₹{profile.principal.toLocaleString("en-IN")}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-bg-tertiary text-accent-blue border-border-subtle font-mono"
            >
              {profile.tenorMonths}{" "}
              {profile.language === "hi" ? "महीने" : "Months"}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-bg-tertiary text-accent-gold border-border-subtle font-mono"
            >
              {profile.taxSlab}% Tax Slab
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end bg-bg-secondary p-1 rounded-xl border border-white/5 gap-1 w-full md:w-auto max-w-full">
          {["BestYield", "Safest", "ShortTerm", "LongTerm"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex-1 min-w-[92px] md:flex-none ${activeFilter === filter ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-white"}`}
            >
              {filter === "BestYield"
                ? t.filters.yield
                : filter === "Safest"
                  ? t.filters.safest
                  : filter === "ShortTerm"
                    ? t.filters.short
                    : t.filters.long}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span>Rates sourced from Supabase · Last updated: {lastUpdated}</span>
      </div>

      {/* Comparison Table / Cards */}
      <div className="rounded-3xl border border-border-subtle bg-bg-secondary/50 backdrop-blur-sm shadow-2xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-text-muted font-bold">
              <tr>
                <th className="px-6 py-5">{t.table.bank}</th>
                <th className="px-6 py-5">{t.table.rate}</th>
                <th className="px-6 py-5 text-accent-blue">{t.table.yield}</th>
                <th className="px-6 py-5">{t.table.maturity}</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-muted">
                      Fetching latest bank rates...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((fd, i) => {
                  const res = calculateYield({
                    principal: profile.principal,
                    tenorMonths: profile.tenorMonths,
                    grossRate: fd.grossRate,
                    taxSlab: profile.taxSlab as any,
                    interestType: "Cumulative",
                  });

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={fd.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-accent-gold overflow-hidden">
                            {fd.bankName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              {fd.bankName}
                              {fd.isSafe && (
                                <div className="group/info relative">
                                  <ShieldCheck
                                    size={14}
                                    className="text-accent-blue"
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-primary border border-white/10 rounded-lg text-[10px] leading-tight opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity z-50">
                                    DICGC Insured: Principal + Interest up to ₹5
                                    Lakh protected by RBI.
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-text-muted uppercase tracking-wider">
                              {fd.category} • {fd.tenor} Days
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-mono font-bold text-lg">
                        {fd.grossRate}%
                      </td>
                      <td className="px-6 py-6">
                        <div className="font-mono font-bold text-accent-blue text-xl">
                          {res.effectiveAnnualYield.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">
                          After TDS & Tax
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="font-mono font-bold text-lg">
                          {formatCurrency(res.netMaturityAmount)}
                        </div>
                        <div className="text-[10px] text-accent-gold uppercase tracking-wider font-bold">
                          ₹{res.netInterestEarned.toLocaleString("en-IN")}{" "}
                          Profit
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <Button
                          onClick={() => handleBook(fd)}
                          className="bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl shadow-lg shadow-accent-blue/10"
                        >
                          Book Now
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-white/5">
          {loading ? (
            <div className="px-6 py-20 text-center">
              <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-muted text-sm">
                Fetching latest bank rates...
              </p>
            </div>
          ) : (
            filteredProducts.map((fd, i) => {
              const res = calculateYield({
                principal: profile.principal,
                tenorMonths: profile.tenorMonths,
                grossRate: fd.grossRate,
                taxSlab: profile.taxSlab as any,
                interestType: "Cumulative",
              });

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={fd.id}
                  className="p-6 bg-bg-secondary/20"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-accent-gold text-lg">
                        {fd.bankName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-lg flex items-center gap-1.5">
                          {fd.bankName}
                          {fd.isSafe && (
                            <ShieldCheck
                              size={16}
                              className="text-accent-blue"
                            />
                          )}
                        </div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">
                          {fd.category} • {fd.tenor} Days
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                        {t.table.rate}
                      </div>
                      <div className="font-mono font-bold text-xl">
                        {fd.grossRate}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                        Post-Tax Yield
                      </div>
                      <div className="font-mono font-bold text-accent-blue text-xl">
                        {res.effectiveAnnualYield.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                        Profit
                      </div>
                      <div className="font-mono font-bold text-accent-gold text-xl">
                        ₹{res.netInterestEarned.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">
                        Maturity Amount
                      </div>
                      <div className="font-mono font-bold text-lg">
                        {formatCurrency(res.netMaturityAmount)}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBook(fd)}
                      className="bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl flex-1 h-12 shadow-lg shadow-accent-blue/20"
                    >
                      Book Now
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-text-muted italic text-xs">
        <Info size={14} />
        <p>{t.disclaimer}</p>
      </div>

      <BookingModal
        isOpen={bookingState.isOpen}
        onClose={() => setBookingState({ ...bookingState, isOpen: false })}
        fd={bookingState.fd}
        principal={profile.principal}
      />
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useUserStore } from "../store/userStore";
import { useAuthStore } from "../store/authStore";
import { calculateYield, formatCurrency } from "../lib/calculator";
import { Link } from "react-router-dom";
import { FDProduct } from "../lib/types";
import { translations } from "../lib/translations";
import { supabase } from "../lib/supabase";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  fd: FDProduct;
  principal: number;
}

export default function BookingModal({
  isOpen,
  onClose,
  fd,
  principal,
}: BookingModalProps) {
  const { bookFD, taxSlab, language } = useUserStore();
  const { user, setAuthModalOpen } = useAuthStore();
  const t = translations[language].booking;

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    phone: "",
    amount: principal,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [phoneError, setPhoneError] = useState("");

  const results = useMemo(() => {
    if (!fd)
      return {
        totalInterest: 0,
        totalMaturityAmount: 0,
        taxAmount: 0,
        netMaturityAmount: 0,
        effectiveAnnualYield: 0,
      };

    return calculateYield({
      principal: formData.amount,
      tenorMonths: fd.tenor,
      grossRate: fd.grossRate,
      taxSlab: taxSlab,
      interestType: "Cumulative",
    });
  }, [formData.amount, fd, taxSlab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    // Indian Phone Validation: Starts with 6-9, followed by 10 total digits
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError(
        language === "hi"
          ? "कृपया एक वैध 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit Indian mobile number",
      );
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setStatus("loading");

    try {
      const { error } = await supabase.from("fd_bookings").insert({
        user_id: user.id,
        fd_id: `${fd.bankName}-${fd.tenor}`.toLowerCase().replace(/\s+/g, "-"),
        bank_name: fd.bankName,
        bank_type: fd.bankType,
        amount: formData.amount,
        tenor_months: fd.tenor,
        gross_rate: fd.grossRate,
        maturity_amount: results.netMaturityAmount,
        maturity_date: new Date(
          Date.now() + fd.tenor * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        name: formData.name,
        phone: formData.phone,
      });

      if (error) throw error;

      bookFD(fd, formData.amount, {
        maturityDate: new Date(
          Date.now() + fd.tenor * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        maturityAmount: results.netMaturityAmount,
      });

      setStatus("success");
      setTimeout(() => {
        onClose();
        setTimeout(() => setStatus("idle"), 500);
      }, 2000);
    } catch (err) {
      console.error("Booking failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#112240] border border-accent-blue/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        >
          {status === "success" ? (
            <div className="p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-accent-green/20 text-accent-green rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-heading font-black tracking-tight mb-2">
                  ✅ {t.success}
                </h2>
                <p className="text-text-muted mb-4">
                  {language === "hi"
                    ? "आपका निवेश सफलतापूर्वक दर्ज कर लिया गया है।"
                    : "Your investment has been recorded successfully."}
                </p>
                <Link
                  to="/portfolio"
                  className="text-accent-gold font-bold hover:underline flex items-center justify-center gap-2"
                >
                  {t.viewPortfolio}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-2xl font-heading font-black tracking-tight">{t.title}</h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-white/5 p-5 rounded-xl border border-white/10 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h3 className="font-bold text-lg text-accent-gold">
                      {fd.bankName}
                    </h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 font-bold">
                      {fd.tenor} {language === "hi" ? "महीने" : "Months"} •{" "}
                      {fd.grossRate}% {language === "hi" ? "दर" : "Gross Rate"}
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {t.summary.yield}
                    </p>
                    <p className="font-mono text-lg font-bold text-accent-gold">
                      {results.effectiveAnnualYield.toFixed(2)}%
                    </p>
                  </div>
                  <div className="pt-2 text-right">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {t.summary.maturity}
                    </p>
                    <p className="font-mono text-lg font-bold text-white">
                      {formatCurrency(results.netMaturityAmount)}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                      {t.fields.name}
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-[#0d1a2e] border border-white/10 rounded-xl p-3.5 text-sm focus:border-accent-blue outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        {t.fields.phone}
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+91 99999 00000"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setFormData({ ...formData, phone: val });
                        }}
                        className={`w-full bg-[#0d1a2e] border ${phoneError ? "border-red-500" : "border-white/10"} rounded-xl p-3.5 text-sm focus:border-accent-blue outline-none transition-all`}
                      />
                      {phoneError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {phoneError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        {t.fields.amount}
                      </label>
                      <input
                        required
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            amount: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#0d1a2e] border border-white/10 rounded-xl p-3.5 text-sm focus:border-accent-blue outline-none font-mono font-bold transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-extrabold py-7 rounded-xl text-lg shadow-xl shadow-[#F59E0B]/10 transition-all active:scale-[0.98]"
                  >
                    {status === "loading" ? "Processing..." : t.cta}
                  </Button>

                  <div className="text-center">
                    <p className="text-[10px] text-text-muted italic opacity-60">
                      {t.disclaimer}
                    </p>
                  </div>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

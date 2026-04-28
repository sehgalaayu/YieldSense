import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Scale, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { SEBIBanner } from '../components/SEBIDisclaimer';
import { useUserStore } from '../store/userStore';
import { translations } from '../lib/translations';
import { calculateYield, formatCurrency } from '../lib/calculator';

export default function CompareInstrumentsPage() {
  const { language } = useUserStore();
  const t = translations[language].compareFDMF;
  const tNav = translations[language].nav;
  const tCalc = translations[language].calculator;

  const [principal, setPrincipal] = useState(100000);
  const [years, setYears] = useState(5);
  const [taxSlab, setTaxSlab] = useState(30);

  // FD calculations
  const fdRate = 7.5; // Average good FD rate
  const fdGross = principal * Math.pow(1 + fdRate/100, years);
  const fdInterest = fdGross - principal;
  const fdTax = fdInterest * (taxSlab / 100);
  const fdNet = fdGross - fdTax;
  const fdNetReturn = ((fdNet - principal) / principal) * 100;

  // MF calculations (Equity)
  const mfRate = 12; // Conservative equity assumption
  const mfGross = principal * Math.pow(1 + mfRate/100, years);
  const mfGain = mfGross - principal;
  // LTCG: 12.5% on gains above 1.25L
  const taxableMfGain = Math.max(0, mfGain - 125000);
  const mfTax = taxableMfGain * 0.125;
  const mfNet = mfGross - mfTax;
  const mfNetReturn = ((mfNet - principal) / principal) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-syne font-bold mb-6"
      >
        {t.title}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-[#94A3B8] mb-8 max-w-2xl"
      >
        {t.subtitle}
      </motion.p>
      
      <SEBIBanner />

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#112240] p-6 rounded-2xl border border-[#1E3A5F] mb-12 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">{t.visualizer.initial}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white">₹</span>
            <input 
              type="number" 
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 pl-8 pr-4 text-white focus:border-[#1A56DB] outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">{t.visualizer.years}</label>
          <input 
            type="number" 
            min={1} max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2 block">{tCalc.labels.taxSlab}</label>
          <select 
            value={taxSlab}
            onChange={(e) => setTaxSlab(Number(e.target.value))}
            className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none"
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={20}>20%</option>
            <option value={30}>30%</option>
          </select>
        </div>
      </motion.div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={80} /></div>
          <h2 className="text-2xl font-syne font-bold text-white mb-2">{tNav.compare}</h2>
          <p className="text-sm text-[#64748B] mb-8">{t.points.fdCons}</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
              <span className="text-[#94A3B8]">Assumed Rate</span>
              <span className="font-mono">{fdRate}% p.a.</span>
            </div>
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
              <span className="text-[#94A3B8]">{tCalc.results.item1}</span>
              <span className="font-mono">{formatCurrency(fdGross)}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2 text-red-400">
              <span>{tCalc.results.item2} ({taxSlab}%)</span>
              <span className="font-mono">-{formatCurrency(fdTax)}</span>
            </div>
          </div>
          
          <div className="bg-[#112240] rounded-xl p-6 border border-[#1E3A5F] transform transition-transform hover:scale-105 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-1">{tCalc.results.item3}</div>
            <div className="text-4xl font-mono font-bold text-white mb-2">{formatCurrency(fdNet)}</div>
            <div className="text-sm text-[#1A56DB] font-bold">{tCalc.results.yieldNotice}: {fdNetReturn.toFixed(1)}%</div>
          </div>
        </motion.div>

        {/* MF Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0A0F1E] border border-green-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.05)]"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={80} className="text-green-500" /></div>
          <h2 className="text-2xl font-syne font-bold text-white mb-2">{tNav.mf}</h2>
          <p className="text-sm text-[#64748B] mb-8">{t.points.mfPros}</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
              <span className="text-[#94A3B8]">Assumed Rate</span>
              <span className="font-mono text-green-400">{mfRate}% p.a.</span>
            </div>
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
              <span className="text-[#94A3B8]">{tCalc.results.item1}</span>
              <span className="font-mono">{formatCurrency(mfGross)}</span>
            </div>
            <div className="flex justify-between border-b border-[#1E3A5F] pb-2 text-red-400">
              <span>{tCalc.results.item2} (12.5% LTCG)</span>
              <span className="font-mono">-{formatCurrency(mfTax)}</span>
            </div>
          </div>
          
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20 transform transition-transform hover:scale-105 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">{tCalc.results.item3}</div>
            <div className="text-4xl font-mono font-bold text-white mb-2">{formatCurrency(mfNet)}</div>
            <div className="text-sm text-green-400 font-bold">{tCalc.results.yieldNotice}: {mfNetReturn.toFixed(1)}%</div>
          </div>
        </motion.div>
      </div>

      {/* Difference Highlights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-[#112240] to-[#1A56DB]/20 rounded-2xl p-8 border border-[#1A56DB]/30 flex flex-col md:flex-row items-center gap-8 shadow-2xl"
      >
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">{t.title}</h3>
          <p className="text-[#94A3B8]">
            {language === 'hi' 
              ? `${years} वर्षों में, Fixed Deposits के बजाय Equity Mutual Funds चुनने से टैक्स के बाद संपत्ति में ${formatCurrency(mfNet - fdNet)} का अंतर आता है।`
              : `Over ${years} years, choosing Equity Mutual Funds instead of Fixed Deposits creates a wealth difference of `}
            {language !== 'hi' && <strong className="text-white">{formatCurrency(mfNet - fdNet)}</strong>}
            {language !== 'hi' && ' post-tax.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#64748B] uppercase tracking-wider font-bold mb-1">{t.visualizer.gap}</div>
          <div className="text-5xl font-mono font-black text-green-400">+{formatCurrency(mfNet - fdNet)}</div>
        </div>
      </motion.div>

    </motion.div>
  );
}

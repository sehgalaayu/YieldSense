import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { fdProducts } from '../lib/fdData';
import { getRecommendations } from '../lib/recommendations';
import { calculateYield, formatCurrency } from '../lib/calculator';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ShieldCheck, Info, Filter, Award } from 'lucide-react';
import { motion } from 'motion/react';
import BookingModal from '../components/BookingModal';
import { translations } from '../lib/translations';

export default function ComparePage() {
  const profile = useUserStore();
  const t = translations[profile.language].compare;
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Best Yield');
  
  const [bookingState, setBookingState] = useState<{
    isOpen: boolean;
    fd: any | null;
  }>({
    isOpen: false,
    fd: null
  });

  useEffect(() => {
    const rawRecs = getRecommendations(fdProducts, profile);
    let final = [...rawRecs];

    if (activeFilter === 'Safest') {
      final = final.filter(p => p.dicgcInsured && (p.bankType === 'PSU' || p.bankType === 'Private'));
    } else if (activeFilter === 'Short Term') {
      final = final.filter(p => p.tenor < 12);
    } else if (activeFilter === 'Long Term') {
      final = final.filter(p => p.tenor >= 24);
    }

    setFilteredProducts(final);
  }, [profile.principal, profile.tenorMonths, profile.taxSlab, profile.goal, activeFilter]);

  const handleBook = (fd: any) => {
    setBookingState({
      isOpen: true,
      fd
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-syne font-bold mb-4">
            {t.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-bg-tertiary text-accent-blue border-border-subtle font-mono">
              ₹{profile.principal.toLocaleString('en-IN')}
            </Badge>
            <Badge variant="secondary" className="bg-bg-tertiary text-accent-blue border-border-subtle font-mono">
              {profile.tenorMonths} {profile.language === 'hi' ? 'महीने' : 'Months'}
            </Badge>
            <Badge variant="secondary" className="bg-bg-tertiary text-accent-gold border-border-subtle font-mono">
              {profile.taxSlab}% Tax Slab
            </Badge>
          </div>
        </div>
        
        <div className="flex bg-bg-secondary p-1 rounded-xl border border-white/5">
          {['Best Yield', 'Safest', 'Short Term', 'Long Term'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeFilter === filter ? 'bg-accent-blue text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              {filter === 'Best Yield' ? t.filters.yield : 
               filter === 'Safest' ? t.filters.safest : 
               filter === 'Short Term' ? t.filters.short : t.filters.long}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-[#112240] border border-[#1E3A5F] rounded-lg text-xs text-[#64748B] mb-4">
        <span>ℹ️</span>
        <span>Rates are indicative of April 2026 market conditions. For latest rates, verify with respective banks directly.</span>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-3xl border border-border-subtle bg-bg-secondary/50 backdrop-blur-sm shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-bg-tertiary/80 border-b border-border-subtle">
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold sticky left-0 bg-[#0D1A2E] z-10">{t.table.bank}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold">{t.table.tenor}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold">{t.table.rate}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold text-accent-gold">{t.table.yield}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold">{t.table.dicgc}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold">{t.table.score}</th>
              <th className="p-6 text-xs uppercase tracking-widest text-text-muted font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((fd, idx) => {
              const res = calculateYield({
                principal: profile.principal,
                grossRate: fd.grossRate,
                tenorMonths: fd.tenor,
                taxSlab: profile.taxSlab,
                interestType: 'Cumulative'
              });

              return (
                <motion.tr 
                  key={fd.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group border-b border-white/5 hover:bg-accent-blue/5 transition-all cursor-pointer relative"
                >
                  <td className="p-6 sticky left-0 bg-[#0D1A2E] z-10 group-hover:bg-accent-blue/10 transition-colors border-r border-white/5">
                    <div className="flex items-center gap-3">
                      {idx < 3 && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${idx === 0 ? 'bg-accent-gold/20 shadow-lg shadow-accent-gold/10' : idx === 1 ? 'bg-slate-400/20' : 'bg-orange-800/20'}`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-white">{fd.bankName}</span>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest bg-white/5 py-0.5 px-1.5 rounded text-text-muted">
                             {fd.bankType} {profile.language === 'hi' ? 'बैंक' : 'Bank'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-mono text-text-muted">{fd.tenor}M</td>
                  <td className="p-6 font-mono text-accent-blue font-bold">{fd.grossRate}%</td>
                  <td className="p-6 font-mono text-accent-gold font-extrabold">{res.effectiveAnnualYield.toFixed(2)}%</td>
                  <td className="p-6">
                    {fd.dicgcInsured ? (
                      <div className="text-accent-green" title="DICGC Insured">
                        <ShieldCheck size={20} />
                      </div>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-accent-blue" style={{ width: `${fd.score * 10}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-accent-blue">{fd.score}/10</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <Button 
                      onClick={() => handleBook(fd)}
                      className="bg-white/5 hover:bg-accent-gold hover:text-black border border-white/10 rounded-xl text-xs font-bold transition-all px-6 py-4"
                    >
                      {t.table.action}
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
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

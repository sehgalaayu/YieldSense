import { useUserStore } from '../store/userStore';
import { formatCurrency, calculateYield } from '../lib/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

import { translations } from '../lib/translations';
import { supabase } from '../lib/supabase';
import AuthGate from '../components/AuthGate';
import { useState, useEffect } from 'react';

const COLORS = ['#1A56DB', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function DashboardPage() {
  const { bookedFDs, taxSlab, language, user } = useUserStore();
  const t = translations[language].dashboard;
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('fd_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setDbBookings(data);
      setLoading(false);
    };
    loadBookings();
  }, [user]);

  const mergedBookings = useMemo(() => {
    // Merge local guest bookings with Supabase ones
    // Use bank_name + amount + date as a simple unique key to avoid duplicates
    const dbProcessed = dbBookings.map(b => ({
      fdId: `${b.bank_name}-${b.amount}`,
      bankName: b.bank_name,
      bankType: b.bank_type,
      amount: b.amount,
      tenor: b.tenor_months,
      grossRate: b.interest_rate,
      date: b.created_at,
      fromDb: true
    }));

    const all = [...dbProcessed, ...bookedFDs];
    // De-duplicate
    const seen = new Set();
    return all.filter(b => {
      const key = `${b.bankName}-${b.amount}-${new Date(b.date).toDateString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbBookings, bookedFDs]);

  const portfolioStats = useMemo(() => {
    let totalAssets = 0;
    let totalInterest = 0;
    
    const processed = mergedBookings.map(fd => {
      const res = calculateYield({
        principal: fd.amount,
        tenorMonths: fd.tenor,
        grossRate: fd.grossRate,
        taxSlab: taxSlab,
        interestType: 'Cumulative'
      });
      
      totalAssets += fd.amount;
      totalInterest += res.netInterestEarned;

      const bookingDate = new Date(fd.date);
      const maturityDate = new Date(bookingDate);
      maturityDate.setMonth(maturityDate.getMonth() + fd.tenor);

      return {
        ...fd,
        maturityAmount: res.netMaturityAmount,
        interestEarned: res.netInterestEarned,
        maturityDate
      };
    });

    const earliestMaturity = [...processed].sort((a, b) => a.maturityDate.getTime() - b.maturityDate.getTime())[0];

    return { totalAssets, totalInterest, processed, earliestMaturity };
  }, [mergedBookings, taxSlab]);

  const chartData = portfolioStats.processed.map(fd => ({
    name: fd.bankName,
    value: fd.amount
  }));

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-24 text-center animate-pulse">Loading your portfolio...</div>;
  }

  if (mergedBookings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="bg-[#112240] border border-accent-blue/20 rounded-[2rem] p-12 max-w-2xl mx-auto shadow-2xl">
          <div className="w-24 h-24 bg-accent-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-accent-blue">
             <Wallet size={40} />
          </div>
          <h1 className="text-4xl font-syne font-bold mb-4 text-white">{t.empty.title}</h1>
          <p className="text-text-muted mb-12 max-w-md mx-auto italic">
            {t.empty.desc}
          </p>
          <Link to="/compare">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-extrabold px-12 py-8 rounded-2xl text-xl shadow-2xl shadow-[#F59E0B]/20 flex items-center gap-3 mx-auto transition-all active:scale-95">
               {translations[language].nav.compare} FDs <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGate message="Sign in to view your real-time portfolio and manage investments.">
      <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-syne font-bold mb-2">{t.title}</h1>
          <p className="text-text-muted italic">{t.subtitle}</p>
        </div>
        <Link to="/compare">
          <Button className="bg-accent-blue hover:bg-accent-blue/90 font-bold rounded-xl flex items-center gap-2">
            {t.cta} <ArrowRight size={18} />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-bg-tertiary p-8 rounded-3xl border border-border-subtle flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-2 mb-4 text-text-muted">
                 <Wallet size={18} />
                 <span className="text-xs font-bold uppercase tracking-widest">{t.stats.total}</span>
              </div>
              <div className="text-5xl font-mono font-extrabold tracking-tighter">{formatCurrency(portfolioStats.totalAssets)}</div>
           </div>
           <div className="mt-8 flex items-center gap-2 text-accent-green font-bold">
              <TrendingUp size={18} />
              <span>+{formatCurrency(portfolioStats.totalInterest)} {t.stats.interest}</span>
           </div>
        </div>

        <div className="bg-bg-tertiary p-8 rounded-3xl border border-border-subtle lg:col-span-2 flex items-center gap-8">
           <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1A2E', borderColor: '#1E3A5F', borderRadius: '12px', fontSize: '10px' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex-grow grid grid-cols-2 gap-4">
              {chartData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold">{item.name}</span>
                      <span className="text-xs text-text-muted ">{((item.value / portfolioStats.totalAssets) * 100).toFixed(0)}% {t.allocation}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">{t.recent}</h2>
      <div className="space-y-4">
         {portfolioStats.processed.map((fd, i) => (
           <motion.div 
             key={fd.fdId + i}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-bg-secondary border border-border-subtle p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6"
           >
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue font-bold">
                   {fd.bankName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{fd.bankName}</h3>
                  <div className="flex gap-4 items-center">
                    <span className="text-xs flex items-center gap-1 text-text-muted uppercase tracking-widest font-bold">
                       <Calendar size={12} /> {language === 'hi' ? 'बुक किया गया' : 'Booked'} {new Date(fd.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold text-accent-green uppercase tracking-widest bg-accent-green/10 px-2 py-0.5 rounded">{t.status}</span>
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-12 text-center md:text-right">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Principal</span>
                   <span className="font-mono text-xl font-bold">{formatCurrency(fd.amount)}</span>
                </div>
                <Button variant="outline" className="border-border-subtle text-text-muted hover:text-white flex items-center gap-2">
                   Receipt <ExternalLink size={14} />
                </Button>
             </div>
           </motion.div>
         ))}
      </div>

      {portfolioStats.earliestMaturity && (
        <div className="mt-12 bg-accent-blue/5 border border-accent-blue/20 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="max-w-xl">
              <h3 className="text-xl font-bold mb-2 text-accent-gold">{t.maturityAlert}</h3>
              <p className="text-text-muted">
                {language === 'hi' ? 'आपका' : 'Your'} <span className="text-white font-bold">{portfolioStats.earliestMaturity.bankName}</span> {language === 'hi' ? 'फिक्स्ड डिपॉजिट' : 'Fixed Deposit'} {t.maturityNotice} <span className="text-white font-bold">{portfolioStats.earliestMaturity.maturityDate.toLocaleDateString()}</span>. 
                {t.maturityRecap} <span className="text-accent-green font-bold">{formatCurrency(portfolioStats.earliestMaturity.maturityAmount)}</span> {language === 'hi' ? 'सीधे आपके लिंक किए गए बचत खाते में।' : 'directly in your linked savings account.'}
              </p>
           </div>
           <Button className="bg-white text-bg-primary font-bold hover:bg-white/90 px-8 py-6 rounded-xl">{t.reinvestCta}</Button>
        </div>
      )}
    </div>
    </AuthGate>
  );
}

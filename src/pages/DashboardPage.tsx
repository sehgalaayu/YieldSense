import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
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
  const { bookedFDs, taxSlab, language } = useUserStore();
  const { user } = useAuthStore();
  const t = translations[language].dashboard;
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fd_bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDbBookings(data || []);
      } catch (err) {
        console.error('Error loading bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  // Combine local and DB bookings, avoiding duplicates
  const allBookings = useMemo(() => {
    const combined = [...dbBookings];
    // Map DB bookings to app format if needed
    return combined;
  }, [dbBookings]);

  const stats = useMemo(() => {
    const totalPrincipal = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const weightedRate = allBookings.reduce((sum, b) => sum + (b.amount * b.gross_rate), 0) / (totalPrincipal || 1);
    
    // Calculate total maturity value
    const totalMaturity = allBookings.reduce((sum, b) => {
      const results = calculateYield({
        principal: b.amount,
        tenorMonths: b.tenor_months,
        grossRate: b.gross_rate,
        taxSlab: taxSlab,
        interestType: 'Cumulative'
      });
      return sum + results.netMaturityAmount;
    }, 0);

    return {
      totalPrincipal,
      weightedRate,
      totalMaturity,
      totalInterest: totalMaturity - totalPrincipal,
      count: allBookings.length
    };
  }, [allBookings, taxSlab]);

  const chartData = useMemo(() => {
    const banks: Record<string, number> = {};
    allBookings.forEach(b => {
      banks[b.bank_name] = (banks[b.bank_name] || 0) + b.amount;
    });
    return Object.entries(banks).map(([name, value]) => ({ name, value }));
  }, [allBookings]);

  return (
    <AuthGate message="Sign in to view your FD portfolio and track returns.">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div>
            <h1 className="text-4xl font-syne font-bold mb-2">{t.title}</h1>
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
              You haven't booked any Fixed Deposits yet. Start comparing now to find the best rates!
            </p>
            <Link to="/compare">
              <Button className="bg-accent-gold text-black font-bold px-8 py-4 rounded-xl">
                Compare FDs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wider">{t.stats.totalValue}</span>
                </div>
                <div className="text-3xl font-mono font-bold">{formatCurrency(stats.totalPrincipal)}</div>
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
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wider">{t.stats.interest}</span>
                </div>
                <div className="text-3xl font-mono font-bold text-accent-gold">{formatCurrency(stats.totalInterest)}</div>
                <div className="mt-4 text-text-muted text-sm">
                  Estimated at maturity
                </div>
              </motion.div>

              {/* Bookings Table / Cards */}
              <div className="md:col-span-2 bg-bg-secondary rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold">{t.holdings.title}</h3>
                  <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-text-muted">
                    {stats.count} FD{stats.count > 1 ? 's' : ''}
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
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold">{b.bank_name}</div>
                            <div className="text-[10px] text-text-muted">{b.tenor_months} Months</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">{formatCurrency(b.amount)}</td>
                          <td className="px-6 py-4 text-accent-green font-bold">{b.gross_rate}%</td>
                          <td className="px-6 py-4">
                             <div className="text-sm">{new Date(b.maturity_date).toLocaleDateString()}</div>
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
                          <div className="text-xs text-text-muted">{b.tenor_months} Months</div>
                        </div>
                        <div className="text-right">
                          <div className="text-accent-green font-bold text-lg">{b.gross_rate}%</div>
                          <div className="text-[10px] text-text-muted uppercase tracking-widest">Returns</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-[10px] text-text-muted uppercase mb-1">Amount</div>
                          <div className="font-mono font-bold">{formatCurrency(b.amount)}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-right">
                          <div className="text-[10px] text-text-muted uppercase mb-1">Maturity Date</div>
                          <div className="text-sm">{new Date(b.maturity_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Allocation Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-bg-secondary rounded-3xl p-8 border border-white/5 flex flex-col"
            >
              <h3 className="font-bold mb-8 text-center">{t.allocation.title}</h3>
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-text-muted">{d.name}</span>
                    </div>
                    <span className="text-sm font-bold">{((d.value / stats.totalPrincipal) * 100).toFixed(0)}%</span>
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

import { useState, useMemo } from 'react';
import { useUserStore } from '../store/userStore';
import { calculateYield, formatCurrency } from '../lib/calculator';
import { Button } from '../components/ui/button';
import { getFDRates, FDProduct } from '../lib/fdService';
import { calculateSIP, SIPResult } from '../lib/sipCalculator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Info, TrendingUp, Wallet, Receipt, Percent } from 'lucide-react';
import { translations } from '../lib/translations';
import { SEBIBanner } from '../components/SEBIDisclaimer';

export default function CalculatorPage() {
  const profile = useUserStore();
  const language = profile.language;
  const t = translations[language].calculator;

  const [activeTab, setActiveTab] = useState<'FD' | 'SIP'>('FD');
  const [fdRates, setFdRates] = useState<FDProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useMemo(async () => {
    const rates = await getFDRates();
    setFdRates(rates);
    setLoading(false);
  }, []);

  const [calcInput, setCalcInput] = useState({
    tenorMonths: 12,
    taxSlab: profile.taxSlab,
    interestType: 'Cumulative' as 'Cumulative' | 'MonthlyPayout',
    principal: profile.principal
  });

  const [sipInput, setSipInput] = useState({
    monthlyInvestment: 10000,
    expectedReturn: 12,
    years: 10,
    inflationPct: 6
  });

  const nearestTenor = useMemo(() => {
    if (fdRates.length === 0) return 12;
    const tenors = Array.from(new Set(fdRates.map(p => p.tenor))).sort((a, b) => a - b);
    return tenors.reduce((prev, curr) => 
      Math.abs(curr - calcInput.tenorMonths) < Math.abs(prev - calcInput.tenorMonths) ? curr : prev
    );
  }, [calcInput.tenorMonths, fdRates]);

  const results = useMemo(() => {
    if (fdRates.length === 0) return calculateYield({ ...calcInput, grossRate: 7, tenorMonths: calcInput.tenorMonths });
    
    // Current best rate from dataset for the selected or nearest tenor
    const bestFD = fdRates
      .filter(p => p.tenor === nearestTenor)
      .sort((a, b) => b.grossRate - a.grossRate)[0] || fdRates[0];

    return calculateYield({
      ...calcInput,
      grossRate: bestFD.grossRate,
      tenorMonths: calcInput.tenorMonths // Still calculate for the actual requested tenor
    });
  }, [calcInput, nearestTenor, fdRates]);

  const chartData = useMemo(() => {
    if (fdRates.length === 0) return [];
    
    return fdRates
      .filter(p => p.tenor === nearestTenor)
      .map(p => {
        const res = calculateYield({ ...calcInput, grossRate: p.grossRate, tenorMonths: nearestTenor });
        return {
          name: p.bankName.replace(' Bank', '').replace(' Ltd', '').split(' ')[0], // Short bank name
          fullName: p.bankName,
          yield: Number(res.effectiveAnnualYield.toFixed(2)),
          maturity: res.netMaturityAmount
        };
      })
      .sort((a, b) => a.yield - b.yield) // Lowest to highest
      .slice(0, 10); // Show all 10
  }, [calcInput, nearestTenor, fdRates]);

  const sipResults = useMemo(() => {
    return calculateSIP(
      sipInput.monthlyInvestment,
      sipInput.years,
      sipInput.expectedReturn,
      profile.taxSlab,
      sipInput.inflationPct
    );
  }, [sipInput, profile.taxSlab]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-syne font-bold">{t.title}</h1>
        <div className="flex bg-[#0A0F1E] rounded-xl border border-[#1E3A5F] p-1">
          <button 
            onClick={() => setActiveTab('FD')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'FD' ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-[#64748B] hover:text-white'}`}
          >
            Lump Sum FD
          </button>
          <button 
            onClick={() => setActiveTab('SIP')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'SIP' ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-[#64748B] hover:text-white'}`}
          >
            Mutual Fund SIP
          </button>
        </div>
      </div>
      <SEBIBanner />

      {activeTab === 'FD' ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Inputs */}
        <div className="lg:col-span-5 space-y-8 bg-bg-secondary p-8 rounded-3xl border border-border-subtle h-fit">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">{t.labels.principal}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue font-bold">₹</span>
              <input 
                type="number" 
                value={calcInput.principal}
                onChange={(e) => setCalcInput({...calcInput, principal: Number(e.target.value)})}
                className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-4 pl-8 pr-4 text-2xl font-mono font-bold focus:border-accent-blue outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">{t.labels.tenor}</label>
              <span className="text-accent-gold font-mono font-bold">{calcInput.tenorMonths} {language === 'hi' ? 'महीने' : 'Months'}</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range"
                min="0"
                max="6"
                step="1"
                value={[3, 6, 12, 18, 24, 36, 60].indexOf(calcInput.tenorMonths)}
                onChange={(e) => {
                  const val = [3, 6, 12, 18, 24, 36, 60][Number(e.target.value)];
                  setCalcInput({...calcInput, tenorMonths: val});
                }}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-bold opacity-50 px-1">
              {[3, 6, 12, 18, 24, 36, 60].map(v => <span key={v}>{v}</span>)}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">{t.labels.taxSlab}</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 20, 30].map(s => (
                <button
                  key={s}
                  onClick={() => setCalcInput({...calcInput, taxSlab: s as any})}
                  className={`py-3 rounded-xl border font-mono font-bold transition-all ${calcInput.taxSlab === s ? 'bg-accent-blue border-accent-blue text-white' : 'bg-bg-tertiary border-border-subtle text-text-muted hover:border-white/20'}`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">{t.labels.payout}</label>
            <div className="flex bg-bg-tertiary p-1 rounded-xl border border-border-subtle">
              <button
                onClick={() => setCalcInput({...calcInput, interestType: 'Cumulative'})}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${calcInput.interestType === 'Cumulative' ? 'bg-bg-secondary text-white shadow-sm' : 'text-text-muted'}`}
              >
                {t.labels.maturity}
              </button>
              <button
                onClick={() => setCalcInput({...calcInput, interestType: 'MonthlyPayout'})}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${calcInput.interestType === 'MonthlyPayout' ? 'bg-bg-secondary text-white shadow-sm' : 'text-text-muted'}`}
              >
                {t.labels.monthly}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-tertiary p-6 rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-text-muted" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{t.results.item1}</span>
                 </div>
                 <div className="text-2xl font-mono font-bold">{formatCurrency(results.grossMaturityAmount)}</div>
              </div>
              <div className="bg-bg-tertiary p-6 rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-2 mb-2">
                    <Receipt size={16} className="text-accent-red" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{t.results.item2}</span>
                 </div>
                 <div className="text-2xl font-mono font-bold text-accent-red">-{formatCurrency(results.taxPayable + results.tdsDeducted)}</div>
              </div>
           </div>

           <div className="bg-bg-secondary p-8 rounded-3xl border border-accent-gold/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
              <label className="text-xs font-bold uppercase tracking-widest text-accent-gold mb-2 block">{t.results.item3}</label>
              <div className="text-6xl font-mono font-extrabold mb-4">{formatCurrency(results.netMaturityAmount)}</div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 bg-accent-green/20 text-accent-green px-3 py-1 rounded-full text-sm font-bold">
                    <Percent size={14} />
                    {results.effectiveAnnualYield.toFixed(2)}% p.a. {t.results.yieldNotice}
                 </div>
                 {results.monthlyPayout && (
                    <div className="text-sm text-text-muted">
                      + {formatCurrency(results.monthlyPayout)} / {t.results.payoutNotice}
                    </div>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-bg-secondary p-8 rounded-3xl border border-border-subtle">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-lg font-bold">{t.chartTitle}</h3>
                {calcInput.tenorMonths !== nearestTenor && (
                  <p className="text-xs text-text-muted mt-1">{t.nearestNotice}: {nearestTenor} {language === 'hi' ? 'महीने' : 'months'}</p>
                )}
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={[0, 'auto']} 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      unit="%" 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1A2E', borderColor: '#1E3A5F', borderRadius: '12px' }}
                      itemStyle={{ color: '#F59E0B' }}
                      cursor={{ fill: 'rgba(26, 86, 219, 0.1)' }}
                    />
                    <Bar dataKey="yield" radius={[6, 6, 0, 0]}>
                      {chartData.map((_entry, index) => {
                        // Highest is gold, others are blue gradient
                        const isHighest = index === chartData.length - 1;
                        const fillColor = isHighest ? '#F59E0B' : '#1E3A5F';
                        const opacity = isHighest ? 1 : 0.4 + (index / chartData.length) * 0.6;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={fillColor}
                            fillOpacity={opacity}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
         </div>
       </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* SIP Inputs */}
        <div className="lg:col-span-5 space-y-8 bg-bg-secondary p-8 rounded-3xl border border-border-subtle h-fit">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Monthly Investment</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue font-bold">₹</span>
              <input 
                type="number" 
                value={sipInput.monthlyInvestment}
                onChange={(e) => setSipInput({...sipInput, monthlyInvestment: Number(e.target.value)})}
                className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-4 pl-8 pr-4 text-2xl font-mono font-bold focus:border-accent-blue outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Expected Return Rate (p.a)</label>
              <span className="text-accent-gold font-mono font-bold">{sipInput.expectedReturn}%</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={sipInput.expectedReturn}
                onChange={(e) => setSipInput({...sipInput, expectedReturn: Number(e.target.value)})}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Time Period</label>
              <span className="text-accent-gold font-mono font-bold">{sipInput.years} Years</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range"
                min="1"
                max="40"
                step="1"
                value={sipInput.years}
                onChange={(e) => setSipInput({...sipInput, years: Number(e.target.value)})}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Inflation Rate (p.a)</label>
              <span className="text-[#64748B] font-mono font-bold">{sipInput.inflationPct}%</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={sipInput.inflationPct}
                onChange={(e) => setSipInput({...sipInput, inflationPct: Number(e.target.value)})}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
          </div>
        </div>

        {/* SIP Results */}
        <div className="lg:col-span-7 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-tertiary p-6 rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-text-muted" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Invested Amount</span>
                 </div>
                 <div className="text-2xl font-mono font-bold">{formatCurrency(sipResults.totalInvested)}</div>
              </div>
              <div className="bg-bg-tertiary p-6 rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-accent-green" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Est. Returns</span>
                 </div>
                 <div className="text-2xl font-mono font-bold text-accent-green">+{formatCurrency(sipResults.estimatedReturns)}</div>
              </div>
           </div>

           <div className="bg-bg-secondary p-8 rounded-3xl border border-accent-gold/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
              <label className="text-xs font-bold uppercase tracking-widest text-accent-gold mb-2 block">Net Maturity Value (after LTCG tax)</label>
              <div className="text-6xl font-mono font-extrabold mb-4">{formatCurrency(sipResults.netMaturityValue)}</div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-1 bg-accent-green/20 text-accent-green px-3 py-1 rounded-full text-sm font-bold">
                    {sipResults.wealthGainMultiple}x wealth gain
                 </div>
                 <div className="text-sm text-text-muted">
                    LTCG tax: {formatCurrency(sipResults.ltcgTax)}
                 </div>
              </div>
           </div>

           {/* Inflation note */}
           <div className="bg-[#112240] rounded-2xl p-4 border border-[#1E3A5F] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <Info size={20} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-sm text-[#F1F5F9]">
                  In today's money (inflation-adjusted at {sipInput.inflationPct}%): 
                  <span className="text-accent-gold font-mono font-bold ml-2 text-lg">
                    {formatCurrency(sipResults.inflationAdjustedValue)}
                  </span>
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-widest mt-0.5">
                  Real purchasing power after {sipInput.years} years
                </p>
              </div>
           </div>

           {/* Area Chart */}
           <div className="bg-bg-secondary p-8 rounded-3xl border border-border-subtle">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-lg font-bold">Wealth Growth Over Time</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sipResults.monthlyData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1A56DB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `Y${val/12}`}
                      interval={23}
                    />
                    <YAxis 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1A2E', borderColor: '#1E3A5F', borderRadius: '12px' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      labelFormatter={(label) => `Month ${label} (Year ${Math.floor(label/12)})`}
                    />
                    <Area type="monotone" dataKey="value" stroke="#F59E0B" fillOpacity={1} fill="url(#colorValue)" name="Portfolio Value" strokeWidth={3} />
                    <Area type="monotone" dataKey="invested" stroke="#1A56DB" fillOpacity={1} fill="url(#colorInvested)" name="Amount Invested" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted text-center mt-4">
                * Calculations assume equity mutual fund taxation (12.5% LTCG on gains &gt; ₹1.25L).
              </p>
           </div>
        </div>
      </div>
      )}
    </div>
  );
}

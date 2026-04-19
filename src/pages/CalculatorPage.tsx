import { useState, useMemo } from 'react';
import { useUserStore } from '../store/userStore';
import { calculateYield, formatCurrency } from '../lib/calculator';
import { Button } from '../components/ui/button';
import { fdProducts } from '../lib/fdData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Info, TrendingUp, Wallet, Receipt, Percent } from 'lucide-react';
import { translations } from '../lib/translations';

export default function CalculatorPage() {
  const profile = useUserStore();
  const language = profile.language;
  const t = translations[language].calculator;

  const [calcInput, setCalcInput] = useState({
    tenorMonths: 12,
    taxSlab: profile.taxSlab,
    interestType: 'Cumulative' as 'Cumulative' | 'MonthlyPayout'
  });

  const nearestTenor = useMemo(() => {
    const tenors = Array.from(new Set(fdProducts.map(p => p.tenor))).sort((a, b) => a - b);
    return tenors.reduce((prev, curr) => 
      Math.abs(curr - calcInput.tenorMonths) < Math.abs(prev - calcInput.tenorMonths) ? curr : prev
    );
  }, [calcInput.tenorMonths]);

  const results = useMemo(() => {
    // Current best rate from dataset for the selected or nearest tenor
    const bestFD = fdProducts
      .filter(p => p.tenor === nearestTenor)
      .sort((a, b) => b.grossRate - a.grossRate)[0] || fdProducts[0];

    return calculateYield({
      ...calcInput,
      grossRate: bestFD.grossRate,
      tenorMonths: calcInput.tenorMonths // Still calculate for the actual requested tenor
    });
  }, [calcInput, nearestTenor]);

  const chartData = useMemo(() => {
    return fdProducts
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
  }, [calcInput, nearestTenor]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-syne font-bold mb-12">{t.title}</h1>

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
    </div>
  );
}

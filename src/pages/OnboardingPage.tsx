import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStore } from '../store/userStore';
import { Button } from '../components/ui/button';
import { ArrowRight, ChevronLeft, Shield, TrendingUp, Scale, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/calculator';
import { Slider } from '../components/ui/slider';
import { cn } from '../lib/utils';

import { translations } from '../lib/translations';

const TENORS = [3, 6, 12, 18, 24, 36, 60];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const { setProfile, principal, tenorMonths, taxSlab, goal, riskTolerance, language } = useUserStore();
  const t = translations[language].onboarding;

  const steps = [
    t.steps.amount,
    t.steps.tenor,
    t.steps.tax,
    t.steps.goal,
    t.steps.liquidity
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/compare');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-text-muted font-bold uppercase tracking-widest">{language === 'hi' ? 'कदम' : 'Step'} {currentStep + 1} {language === 'hi' ? 'का' : 'of'} {steps.length}</span>
          <span className="text-sm font-medium">{steps[currentStep]}</span>
        </div>
        <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent-blue"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-subtle rounded-3xl p-8 min-h-[500px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-grow"
          >
            {currentStep === 0 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-syne font-bold mb-4">{t.steps.amount}</h2>
                  <p className="text-text-muted">{language === 'hi' ? 'वह मूल राशि दर्ज करें जिसे आप फिक्स्ड डिपॉजिट में डालना चाहते हैं।' : 'Enter the principal amount you want to put into a Fixed Deposit.'}</p>
                </div>
                
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-syne text-accent-blue font-bold">₹</span>
                  <input 
                    type="number"
                    value={principal}
                    onChange={(e) => setProfile({ principal: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border-2 border-border-subtle rounded-2xl py-8 pl-14 pr-8 text-5xl font-mono font-bold focus:border-accent-blue outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[25000, 50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setProfile({ principal: amt })}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${principal === amt ? 'bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20' : 'bg-bg-tertiary border-white/5 text-text-muted hover:border-white/20'}`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
                {principal < 10000 && (
                   <div className="flex items-center gap-2 p-4 bg-accent-red/10 text-accent-red rounded-xl border border-accent-red/20 text-sm">
                      <AlertCircle size={16} /> Min investment is typically ₹10,000 for many banks.
                   </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-4xl font-syne font-bold mb-4">{t.steps.tenor}</h2>
                  <p className="text-text-muted">{language === 'hi' ? 'अपनी निवेश अवधि चुनें। उच्च अवधि आमतौर पर बेहतर दरें प्रदान करती है।' : 'Select your investment horizon. Higher tenors usually offer better rates.'}</p>
                </div>

                <div className="px-4">
                  <div className="mb-12 mt-4">
                    <Slider 
                      value={[TENORS.indexOf(tenorMonths) >= 0 ? TENORS.indexOf(tenorMonths) : 0]} 
                      onValueChange={(val) => setProfile({ tenorMonths: TENORS[val[0]] })}
                      max={TENORS.length - 1} 
                      step={1}
                      aria-label="Tenor Slider" 
                    />
                    <span
                      className="mt-4 flex w-full items-center justify-between gap-1 px-0.5 text-xs font-bold text-[#64748B] uppercase tracking-tighter"
                      aria-hidden="true"
                    >
                      {TENORS.map((m, i) => (
                        <span key={m} className="flex w-0 flex-col items-center justify-center gap-3">
                          <span
                            className={cn("h-2 w-px bg-[#1E3A5F]", TENORS.indexOf(tenorMonths) === i && "bg-[#F59E0B] h-3")}
                          />
                          <button 
                            onClick={() => setProfile({ tenorMonths: m })}
                            className={cn(
                              "transition-colors hover:text-white", 
                              TENORS.indexOf(tenorMonths) === i ? "text-[#F59E0B]" : ""
                            )}
                          >
                            {m}M
                          </button>
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-6xl font-mono font-bold text-accent-gold">{tenorMonths}</span>
                    <span className="text-2xl font-bold ml-2">{language === 'hi' ? 'महीने' : 'Months'}</span>
                    <p className="mt-4 text-accent-blue font-bold uppercase tracking-widest">
                       {tenorMonths < 12 ? (language === 'hi' ? 'कम अवधि' : 'Short Term') : tenorMonths < 36 ? (language === 'hi' ? 'मध्यम अवधि' : 'Medium Term') : (language === 'hi' ? 'लंबी अवधि' : 'Long Term')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-syne font-bold mb-4">What's your tax slab?</h2>
                  <p className="text-text-muted">FD interest is taxed as per your income tax slab. We need this to calculate your real yield.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 0, label: '0%', desc: 'Annual income < ₹3L / No Tax', note: 'Can submit Form 15G to avoid TDS' },
                    { value: 5, label: '5%', desc: 'Income ₹3L - ₹7L', note: 'Low tax impact' },
                    { value: 20, label: '20%', desc: 'Income ₹7L - ₹12L', note: 'Significant TDS deduction' },
                    { value: 30, label: '30%', desc: 'Income above ₹12L', note: 'High tax burden on FD interest' }
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setProfile({ taxSlab: s.value as any })}
                      className={`p-6 rounded-2xl border text-left transition-all ${taxSlab === s.value ? 'bg-accent-blue border-accent-blue text-white' : 'bg-bg-tertiary border-border-subtle hover:border-white/20'}`}
                    >
                      <div className="text-3xl font-mono font-bold mb-1">{s.label}</div>
                      <div className={`font-bold ${taxSlab === s.value ? 'text-white/90' : 'text-text-primary'}`}>{s.desc}</div>
                      <div className={`text-xs mt-2 ${taxSlab === s.value ? 'text-white/60' : 'text-text-muted'}`}>{s.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-syne font-bold mb-4">What's your primary goal?</h2>
                  <p className="text-text-muted">Choose how we should prioritize your FD recommendations.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'MaxYield', label: 'Max Yield 📈', desc: 'Prioritize highest possible returns, including SFBs and NBFCs.', color: 'accent-gold' },
                    { id: 'Safety', label: 'Safety First 🛡️', desc: 'Only high-rated PSU and private banks with DICGC insurance.', color: 'accent-green' },
                    { id: 'Balanced', label: 'Balanced ⚖️', desc: 'The best middle ground between yield and security.', color: 'accent-blue' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setProfile({ goal: g.id as any })}
                      className={`w-full p-8 rounded-2xl border text-left transition-all flex justify-between items-center ${goal === g.id ? 'bg-bg-tertiary border-accent-blue ring-2 ring-accent-blue' : 'bg-bg-tertiary border-border-subtle'}`}
                    >
                      <div>
                         <div className="text-2xl font-syne font-bold mb-1">{g.label}</div>
                         <div className="text-text-muted text-sm">{g.desc}</div>
                      </div>
                      {goal === g.id && <div className="w-6 h-6 rounded-full bg-accent-blue" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-syne font-bold mb-4">Your risk appetite?</h2>
                  <p className="text-text-muted">This helps us decide if we should recommend NBFCs and SFBs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { val: 'Low', label: 'Conservative', desc: 'I prioritize capital safety over high returns.', icon: Shield },
                    { val: 'Medium', label: 'Moderate', desc: 'Willing to take slight risk for better yields.', icon: Scale },
                    { val: 'High', label: 'Aggressive', desc: 'Comfortable with SFBs and high-rated NBFCs.', icon: TrendingUp }
                  ].map((r) => (
                    <button
                      key={r.val}
                      onClick={() => setProfile({ riskTolerance: r.val as any })}
                      className={`p-6 rounded-2xl border text-center transition-all flex flex-col items-center gap-4 ${riskTolerance === r.val ? 'bg-accent-blue border-accent-blue text-white shadow-xl' : 'bg-bg-tertiary border-border-subtle hover:border-white/20'}`}
                    >
                      <div className={`${riskTolerance === r.val ? 'text-white' : 'text-accent-blue'}`}><r.icon size={32} /></div>
                      <div className="text-xl font-syne font-bold">{r.label}</div>
                      <p className={`text-xs ${riskTolerance === r.val ? 'text-white/80' : 'text-text-muted'}`}>{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pt-8 border-t border-border-subtle">
           <button 
             onClick={handleBack}
             disabled={currentStep === 0}
             className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${currentStep === 0 ? 'opacity-0' : 'text-text-muted hover:text-white'}`}
           >
             <ChevronLeft size={20} /> {language === 'hi' ? 'पीछे' : 'Back'}
           </button>
           <Button 
             onClick={handleNext}
             className="bg-accent-gold hover:bg-accent-gold/90 text-bg-primary px-10 font-extrabold text-lg py-6 rounded-xl flex items-center gap-3"
           >
             {currentStep === steps.length - 1 ? t.finish : t.next} <ArrowRight size={20} />
           </Button>
        </div>
      </div>
    </div>
  );
}

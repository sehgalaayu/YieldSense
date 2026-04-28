import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentNAV } from '../lib/amfiApi';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'motion/react';
import { translations } from '../lib/translations';
import { SEBIBanner } from '../components/SEBIDisclaimer';
import AuthGate from '../components/AuthGate';

export default function MFResultsPage() {
  const navigate = useNavigate();
  const { mfAnalysisResults, language, navCache, setNavCache } = useUserStore();
  const { user } = useAuthStore();
  const t = translations[language].mfResults;
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [navLoading, setNavLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (mfAnalysisResults.length === 0) {
      navigate('/mf/analyze');
    } else {
      mfAnalysisResults.forEach(result => {
        const { regularFund, directFund } = result;
        [regularFund, directFund].forEach(fund => {
          if (fund && fund.schemeCode && !navCache[fund.schemeCode] && !navLoading[fund.schemeCode]) {
            setNavLoading(prev => ({ ...prev, [fund.schemeCode]: true }));
            fetchCurrentNAV(fund.schemeCode).then(nav => {
              if (nav) setNavCache(fund.schemeCode, nav);
              setNavLoading(prev => ({ ...prev, [fund.schemeCode]: false }));
            });
          }
        });
      });
    }
  }, [mfAnalysisResults, navigate]);

  if (mfAnalysisResults.length === 0) return null;

  const totalAnnualCost = mfAnalysisResults.reduce((acc, curr) => acc + curr.analysis.regularFund.annualCostRs, 0);
  const totalAnnualSaving = mfAnalysisResults.reduce((acc, curr) => acc + curr.analysis.annualSavingRs, 0);
  const total10YSaving = mfAnalysisResults.reduce((acc, curr) => acc + curr.analysis.savingOver10Y, 0);
  
  const avgRegularExp = mfAnalysisResults.reduce((acc, curr) => acc + curr.analysis.regularFund.expenseRatio, 0) / mfAnalysisResults.length;
  const avgDirectExp = mfAnalysisResults.reduce((acc, curr) => acc + curr.analysis.directFund.expenseRatio, 0) / mfAnalysisResults.length;

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskAI = (prompt: string) => {
    // Open chat window and prepopulate/send
    // In a real app we might trigger a chat drawer open event here
    // For now we'll just populate a message if that's supported, or dispatch custom event
    const event = new CustomEvent('open-ai-chat', { detail: { prompt } });
    window.dispatchEvent(event);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pt-24 pb-32"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <h1 className="text-2xl sm:text-3xl font-syne font-bold mb-6">{t.title}</h1>
          <SEBIBanner />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-xs text-red-400 uppercase tracking-wider mb-1">{t.totalDrain}</div>
              <div className="text-2xl font-mono text-red-400 font-bold">₹{totalAnnualCost.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-xs text-green-400 uppercase tracking-wider mb-1">{t.yearlyLoss}</div>
              <div className="text-2xl font-mono text-green-400 font-bold">₹{totalAnnualSaving.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="text-xs text-[#F59E0B] uppercase tracking-wider mb-1 font-bold">{t.next10Years}</div>
              <div className="text-3xl font-mono text-[#F59E0B] font-bold">₹{total10YSaving.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </motion.div>

        {/* PORTFOLIO SCORE CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#112240] border border-[#1E3A5F] rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-[#F59E0B] to-green-500" />
          <h2 className="text-xl sm:text-2xl font-medium mb-6">
            {language === 'hi' ? 'आपका पोर्टफोलियो आपको सामान्य से ' : 'Your Portfolio is costing you '}<span className="text-red-400 font-bold">{(avgRegularExp / avgDirectExp).toFixed(1)}x</span>{language === 'hi' ? ' अधिक खर्च करा रहा है।' : ' more than it should.'}
          </h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#94A3B8]">{t.cards.regExpense}</span>
              <span className="text-red-400 font-mono">{avgRegularExp.toFixed(2)}%</span>
            </div>
            <div className="w-full h-3 bg-[#0A0F1E] rounded-full overflow-hidden flex">
              <div className="h-full bg-red-500" style={{ width: `${(avgRegularExp / 2.5) * 100}%` }} />
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#94A3B8]">{t.cards.dirExpense}</span>
              <span className="text-green-400 font-mono">{avgDirectExp.toFixed(2)}%</span>
            </div>
            <div className="w-full h-3 bg-[#0A0F1E] rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500" style={{ width: `${(avgDirectExp / 2.5) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 bg-[#0A0F1E] rounded-xl border border-[#1E3A5F] text-center">
            <p className="text-[#94A3B8]">{language === 'hi' ? 'सभी होल्डिंग्स को Direct में बदलने पर आप बचाएंगे' : 'Switching all holdings to Direct would save you'}</p>
            <p className="text-xl font-bold text-[#F1F5F9]">₹{total10YSaving.toLocaleString('en-IN')} {t.next10Years}</p>
          </div>
        </motion.div>

        {/* PER-FUND ANALYSIS */}
        <h3 className="text-xl font-syne font-bold mb-4">{t.cards.fundDetails}</h3>
        <div className="space-y-4 mb-12">
          {mfAnalysisResults.map((result, idx) => {
            const isExpanded = expandedCards[result.holding.fundId] || false;
            const { analysis } = result;
            const isLocked = idx > 0 && !user;
            
            const cardContent = (
              <div 
                className={`bg-[#112240] border ${analysis.shouldSwitch ? 'border-green-500/30' : 'border-[#1E3A5F]'} rounded-xl overflow-hidden transition-all duration-300`}
              >
                {/* Card Header (Always visible) */}
                <div 
                  className="p-5 cursor-pointer hover:bg-[#1E3A5F]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  onClick={() => !isLocked && toggleCard(result.holding.fundId)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-lg">{analysis.regularFund.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-[#0A0F1E] px-2 py-1 rounded text-[#94A3B8] border border-[#1E3A5F]">{result.regularFund.category}</span>
                      {analysis.switchUrgency === 'High' && <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 font-bold">HIGH URGENCY</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col justify-between sm:items-end w-full sm:w-auto gap-2 sm:gap-1">
                    <div className="text-sm">
                      <span className="text-[#94A3B8]">{t.cards.regExpense}: </span>
                      <span className="text-red-400 font-mono">₹{analysis.regularFund.annualCostRs.toLocaleString('en-IN')}/yr</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[#94A3B8]">{t.cards.dirExpense}: </span>
                      <span className="text-green-400 font-mono">₹{analysis.directFund.annualCostRs.toLocaleString('en-IN')}/yr</span>
                    </div>
                  </div>
                </div>

                {/* Card Expanded Content */}
                {isExpanded && !isLocked && (
                  <div className="p-5 pt-0 border-t border-[#1E3A5F]">
                    
                    {/* Comparison View */}
                    <div className="mt-4 mb-6">
                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-[#94A3B8] bg-[#0A0F1E] border-y border-[#1E3A5F]">
                            <tr>
                              <th className="px-4 py-3 font-medium">Metric</th>
                              <th className="px-4 py-3 font-medium">Regular (Current)</th>
                              <th className="px-4 py-3 font-medium">Direct (Alternative)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[#1E3A5F]/50">
                              <td className="px-4 py-3 text-[#94A3B8]">Expense Ratio</td>
                              <td className="px-4 py-3 text-red-400 font-mono">{analysis.regularFund.expenseRatio}%</td>
                              <td className="px-4 py-3 text-green-400 font-mono">{analysis.directFund.expenseRatio}%</td>
                            </tr>
                            <tr className="border-b border-[#1E3A5F]/50">
                              <td className="px-4 py-3 text-[#94A3B8]">Annual Fee (₹)</td>
                              <td className="px-4 py-3 text-red-400 font-mono">₹{analysis.regularFund.annualCostRs.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-green-400 font-mono">₹{analysis.directFund.annualCostRs.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-[#94A3B8]">10Y Projection</td>
                              <td className="px-4 py-3">₹{analysis.regularFund.projectedValue10Y.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 font-bold text-green-400">₹{analysis.directFund.projectedValue10Y.toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="sm:hidden space-y-4">
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-[#1E3A5F] flex justify-between items-center">
                          <span className="text-[#94A3B8] text-xs uppercase font-bold tracking-widest">Expense Ratio</span>
                          <div className="flex gap-4">
                            <span className="text-red-400 font-mono font-bold">{analysis.regularFund.expenseRatio}%</span>
                            <span className="text-green-400 font-mono font-bold">{analysis.directFund.expenseRatio}%</span>
                          </div>
                        </div>
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-[#1E3A5F] flex justify-between items-center">
                          <span className="text-[#94A3B8] text-xs uppercase font-bold tracking-widest">Annual Fee</span>
                          <div className="flex gap-4">
                            <span className="text-red-400 font-mono font-bold">₹{analysis.regularFund.annualCostRs.toLocaleString('en-IN')}</span>
                            <span className="text-green-400 font-mono font-bold">₹{analysis.directFund.annualCostRs.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="bg-[#0A0F1E] p-4 rounded-xl border border-accent-blue/30 flex justify-between items-center">
                          <span className="text-accent-blue text-xs uppercase font-bold tracking-widest">10Y Projection</span>
                          <div className="flex gap-4 text-right">
                             <span className="text-green-400 font-mono font-bold">₹{analysis.directFund.projectedValue10Y.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Savings Impact Visual */}
                    <h5 className="text-sm font-medium text-[#94A3B8] mb-3 uppercase tracking-wider">Compound Savings Impact</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                      <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-[#94A3B8] mb-1">5 Years</div>
                        <div className="text-[#F59E0B] font-bold">Save ₹{analysis.savingOver5Y.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-lg p-4 text-center transform scale-105 shadow-lg">
                        <div className="text-xs text-[#94A3B8] mb-1">10 Years</div>
                        <div className="text-[#F59E0B] font-bold text-lg">Save ₹{analysis.savingOver10Y.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Recommendation Box */}
                    <div className={`border rounded-xl p-4 mb-6 ${analysis.shouldSwitch ? 'border-green-500/50 bg-green-500/5' : 'border-[#F59E0B]/50 bg-[#F59E0B]/5'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{analysis.shouldSwitch ? '✅' : '⚠️'}</span>
                        <h5 className={`font-bold ${analysis.shouldSwitch ? 'text-green-400' : 'text-[#F59E0B]'}`}>
                          {analysis.shouldSwitch ? 'We recommend switching to Direct' : 'Hold before switching'}
                        </h5>
                      </div>
                      <p className="text-sm text-[#94A3B8]">🏦 <strong>Note:</strong> {analysis.taxNote}</p>
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
                key={idx} 
              >
                {idx > 0 ? (
                  <AuthGate message="Sign in to unlock full analysis for all your funds">
                    {cardContent}
                  </AuthGate>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* AI ADVISOR STRIP */}
        <div className="bg-gradient-to-r from-[#112240] to-[#1A56DB]/20 border border-[#1A56DB]/50 rounded-2xl p-6 sm:p-8 mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center text-xs">AI</span>
              Ask WealthSense AI about your portfolio
            </h3>
            <p className="text-[#94A3B8] text-sm mb-4">Confused about taxes or exit loads? Ask our AI advisor for personalized guidance.</p>
            
            <div className="flex flex-col gap-2">
              {[
                "Should I switch all my Regular funds at once?",
                "Which of my funds should I switch first?",
                "What's the tax impact of switching these funds?"
              ].map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleAskAI(prompt)}
                  className="text-left text-sm p-3 rounded-lg bg-[#0A0F1E]/50 border border-[#1E3A5F] hover:border-[#1A56DB] hover:bg-[#1A56DB]/10 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button 
              onClick={() => handleAskAI("Hello! Please review my mutual fund portfolio.")}
              className="px-6 py-3 bg-[#F1F5F9] text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg"
            >
              Open AI Chat
            </button>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (sticky on mobile) */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-[#0A0F1E] sm:bg-transparent border-t sm:border-0 border-[#1E3A5F] z-20 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/mf/analyze')}
            className="flex-1 py-3 bg-[#112240] border border-[#1E3A5F] rounded-xl font-medium hover:bg-[#1E3A5F] transition-colors"
          >
            {t.actions.addFunds}
          </button>
          <button 
            className="flex-1 py-3 bg-[#1A56DB] text-white rounded-xl font-medium hover:bg-[#1648C0] shadow-lg shadow-[#1A56DB]/20 transition-all"
          >
            {t.actions.shareAnalysis}
          </button>
        </div>
        
      </div>
    </motion.div>
  );
}

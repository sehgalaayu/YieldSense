import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Check, Loader2, BookmarkPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/translations';
import { searchFunds, getDirectEquivalent, MutualFund } from '../lib/mfData';
import { analyzeSwitch } from '../lib/mfCalculator';
import { searchAMFIFunds, fetchCurrentNAV, fetchHistoricalNAV, calculate1YReturn } from '../lib/amfiApi';

export default function MFAnalyzePage() {
  const navigate = useNavigate();
  const { mfHoldings, addMFHolding, removeMFHolding, setMFAnalysisResults, taxSlab, setProfile, language } = useUserStore();
  const { user, setAuthModalOpen } = useAuthStore();
  const t = translations[language].mfAnalyze;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [amfiResults, setAmfiResults] = useState<any[]>([]);
  const [isSearchingAMFI, setIsSearchingAMFI] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const toggleWatchlist = async (fund: any) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setWatchlistLoading(fund.schemeCode || fund.id);
    try {
      const schemeCode = fund.schemeCode || fund.id;
      const { data: existing } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheme_code', schemeCode)
        .single();

      if (existing) {
        await supabase.from('watchlist').delete().eq('id', existing.id);
      } else {
        await supabase.from('watchlist').insert({
          user_id: user.id,
          scheme_code: schemeCode,
          fund_name: fund.schemeName || fund.shortName,
          category: fund.category,
          last_nav: fund.nav || 0
        });
      }
    } catch (err) {
      console.error('Watchlist error:', err);
    } finally {
      setWatchlistLoading(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (q.length > 2) {
      setSearchResults(searchFunds(q));
      setIsSearchingAMFI(true);
      searchTimeout.current = setTimeout(async () => {
        const liveResults = await searchAMFIFunds(q);
        setAmfiResults(liveResults);
        setIsSearchingAMFI(false);
      }, 400);
    } else {
      setSearchResults([]);
      setAmfiResults([]);
      setIsSearchingAMFI(false);
    }
  };

  const handleSelectFund = (fund: any) => {
    if (!mfHoldings.find(h => h.fundId === fund.id)) {
      addMFHolding({
        fundId: fund.id,
        investedAmount: 100000,
        holdingPeriodMonths: 24,
        isLive: false,
      });
    }
    setSearchQuery('');
    setSearchResults([]);
    setAmfiResults([]);
  };

  const handleSelectAMFIFund = (fund: any) => {
    const id = `live-${fund.schemeCode}`;
    if (!mfHoldings.find(h => h.fundId === id)) {
      addMFHolding({
        fundId: id,
        investedAmount: 100000,
        holdingPeriodMonths: 24,
        isLive: true,
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        expenseRatio: 1.5, // default
      });
    }
    setSearchQuery('');
    setSearchResults([]);
    setAmfiResults([]);
  };

  const updateHoldingAmount = (fundId: string, amount: number) => {
    const holding = mfHoldings.find(h => h.fundId === fundId);
    if (holding) {
      removeMFHolding(fundId);
      addMFHolding({ ...holding, investedAmount: amount });
    }
  };

  const updateHoldingPeriod = (fundId: string, months: number) => {
    const holding = mfHoldings.find(h => h.fundId === fundId);
    if (holding) {
      removeMFHolding(fundId);
      addMFHolding({ ...holding, holdingPeriodMonths: months });
    }
  };

  const updateExpenseRatio = (fundId: string, ratio: number) => {
    const holding = mfHoldings.find(h => h.fundId === fundId);
    if (holding) {
      removeMFHolding(fundId);
      addMFHolding({ ...holding, expenseRatio: ratio });
    }
  };

  const handleAnalyze = () => {
    if (mfHoldings.length === 0) return;

    const results = mfHoldings.map(holding => {
      let regularFund: any;
      let directFund: any;

      if (holding.isLive) {
        // Mock the fund objects for the calculator
        regularFund = {
          id: holding.fundId,
          schemeName: holding.schemeName,
          shortName: holding.schemeName,
          amcName: 'Unknown AMC',
          category: 'Live Scheme',
          subCategory: 'Equity',
          variant: 'Regular',
          expenseRatio: holding.expenseRatio || 1.5,
          nav: 100, // will be updated live in results page
          aum: 0,
          returns: { oneYear: 12, threeYear: 10, fiveYear: 10 },
          riskLevel: 'Moderate',
          exitLoad: '1% if redeemed within 1 year',
          schemeCode: holding.schemeCode,
          isIndexFund: false
        };
        // Mock direct equivalent with 1% lower expense ratio
        directFund = {
          ...regularFund,
          id: `${holding.fundId}-dir`,
          variant: 'Direct',
          schemeName: holding.schemeName?.replace('Regular', 'Direct') || `${holding.schemeName} - Direct`,
          expenseRatio: Math.max(0.1, (holding.expenseRatio || 1.5) - 1.0)
        };
      } else {
        const regularFunds = searchFunds(''); 
        regularFund = regularFunds.find(f => f.id === holding.fundId);
        directFund = getDirectEquivalent(holding.fundId);
      }
      
      if (!regularFund || !directFund) return null;

      const analysis = analyzeSwitch(holding, regularFund, directFund);
      return {
        holding,
        regularFund,
        directFund,
        analysis
      };
    }).filter(Boolean) as any[];

    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    setMFAnalysisResults(results);
    navigate('/mf/results');
  };

  const getPeriodValue = (str: string) => {
    if (str === '< 6m') return 3;
    if (str === '6-12m') return 9;
    if (str === '1-3y') return 24;
    return 48;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pt-24 pb-20"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* LEFT COLUMN — Input Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-syne font-bold mb-8">{t.title}</h1>
          
          {/* STEP 1: Fund Search */}
          <div className="mb-8 relative z-30">
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">{t.searchLabel}</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t.searchPlaceholder}
              className="w-full bg-[#112240] border border-[#1E3A5F] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]"
            />
            
            {/* Search Dropdown */}
            {(searchResults.length > 0 || amfiResults.length > 0 || isSearchingAMFI) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-20 top-full left-0 right-0 mt-2 bg-[#112240] border border-[#1E3A5F] rounded-xl shadow-xl max-h-80 overflow-y-auto"
              >
                {searchResults.length > 0 && (
                  <div className="px-4 py-2 bg-[#0A0F1E] text-xs font-bold text-[#64748B] uppercase tracking-wider sticky top-0 border-b border-[#1E3A5F]">
                    {t.curatedTop}
                  </div>
                )}
                {searchResults.map(fund => (
                  <div key={fund.id} className="flex items-center hover:bg-[#1E3A5F] border-b border-[#1E3A5F]/50 last:border-0 group">
                    <button 
                      onClick={() => handleSelectFund(fund)}
                      className="flex-1 text-left px-4 py-3 flex justify-between items-center"
                    >
                      <span className="font-medium">{fund.shortName}</span>
                      <span className="text-xs px-2 py-1 bg-[#1E3A5F] rounded text-[#94A3B8]">{fund.category}</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(fund); }}
                      className="p-3 text-[#64748B] hover:text-accent-gold transition-colors"
                      title="Add to Watchlist"
                    >
                      {watchlistLoading === fund.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                ))}
                
                <div className="px-4 py-2 bg-[#0A0F1E] text-xs font-bold text-[#64748B] uppercase tracking-wider sticky top-0 border-y border-[#1E3A5F] flex justify-between items-center">
                  <span>{t.searchAll}</span>
                  {isSearchingAMFI && <span className="w-3 h-3 border-2 border-t-transparent border-[#3B82F6] rounded-full animate-spin" />}
                </div>
                {amfiResults.map(fund => (
                  <div key={fund.schemeCode} className="flex items-center hover:bg-[#1E3A5F] border-b border-[#1E3A5F]/50 last:border-0 group">
                    <button 
                      onClick={() => handleSelectAMFIFund(fund)}
                      className="flex-1 text-left px-4 py-3 flex justify-between items-center"
                    >
                      <span className="font-medium text-sm">{fund.schemeName}</span>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded flex-shrink-0 ml-2 border border-green-500/20">Live</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(fund); }}
                      className="p-3 text-[#64748B] hover:text-accent-gold transition-colors"
                      title="Add to Watchlist"
                    >
                      {watchlistLoading === fund.schemeCode ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                ))}
                {!isSearchingAMFI && amfiResults.length === 0 && searchQuery.length > 2 && (
                   <div className="px-4 py-3 text-sm text-[#64748B] text-center">{t.noFunds}</div>
                )}
              </motion.div>
            )}
          </div>

          {/* Holdings List */}
          {mfHoldings.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-medium">{t.portfolioTitle}</h3>
              {mfHoldings.map(holding => {
                const fund = holding.isLive 
                  ? { shortName: holding.schemeName, category: 'Live Data from AMFI' }
                  : searchFunds('').find(f => f.id === holding.fundId);
                
                if (!fund) return null;
                
                return (
                  <div key={holding.fundId} className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-5 relative">
                    <button 
                      onClick={() => removeMFHolding(holding.fundId)}
                      className="absolute top-4 right-4 text-[#64748B] hover:text-red-400"
                    >
                      ✕
                    </button>
                    
                    <div className="mb-4">
                      <div className="font-medium text-lg pr-6">{fund.shortName}</div>
                      <div className="text-xs text-[#64748B] mt-1">{fund.category} {holding.isLive ? '' : '• Regular Plan'}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-[#94A3B8] mb-1">{t.investedAmount}</label>
                        <input 
                          type="number" 
                          value={holding.investedAmount}
                          onChange={(e) => updateHoldingAmount(holding.fundId, Number(e.target.value))}
                          className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#94A3B8] mb-1">{t.holdingPeriod}</label>
                        <select 
                          value={holding.holdingPeriodMonths < 6 ? '< 6m' : holding.holdingPeriodMonths < 12 ? '6-12m' : holding.holdingPeriodMonths < 36 ? '1-3y' : '3+y'}
                          onChange={(e) => updateHoldingPeriod(holding.fundId, getPeriodValue(e.target.value))}
                          className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="< 6m">{t.periods.p1}</option>
                          <option value="6-12m">{t.periods.p2}</option>
                          <option value="1-3y">{t.periods.p3}</option>
                          <option value="3+y">{t.periods.p4}</option>
                        </select>
                      </div>
                    </div>

                    {holding.isLive && (
                      <div className="bg-[#0A0F1E] border border-[#F59E0B]/30 rounded-lg p-3">
                        <label className="block text-xs text-[#F59E0B] mb-1">{t.expenseRatioManual}</label>
                        <p className="text-[10px] text-[#94A3B8] mb-2">{t.expenseRatioHint}</p>
                        <input
                          type="number" 
                          step="0.01"
                          value={holding.expenseRatio || ''}
                          onChange={(e) => updateExpenseRatio(holding.fundId, Number(e.target.value))}
                          className="w-full bg-[#112240] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                          placeholder="e.g. 1.52"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: Tax Slab */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#94A3B8] mb-3">{t.taxSlabLabel}</label>
            <div className="flex gap-2">
              {[0, 5, 20, 30].map(slab => (
                <button
                  key={slab}
                  onClick={() => setProfile({ taxSlab: slab as 0|5|20|30 })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${taxSlab === slab ? 'bg-[#3B82F6] text-white border-transparent' : 'bg-[#112240] border border-[#1E3A5F] text-[#94A3B8] hover:border-[#3B82F6]'}`}
                >
                  {slab}%
                </button>
              ))}
            </div>
          </div>

          <motion.button 
            whileHover={mfHoldings.length > 0 ? { scale: 1.02 } : {}}
            onClick={handleAnalyze}
            disabled={mfHoldings.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${mfHoldings.length > 0 ? 'bg-[#F59E0B] text-black hover:bg-[#D97706] shadow-lg shadow-[#F59E0B]/20' : 'bg-[#1E3A5F] text-[#64748B] cursor-not-allowed'}`}
          >
            {t.analyzeBtn}
          </motion.button>
        </motion.div>

        {/* RIGHT COLUMN — Live Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block relative"
        >
          <div className="sticky top-24">
            {mfHoldings.length === 0 ? (
              <div className="bg-[#112240] border border-[#1E3A5F] rounded-2xl p-8 h-96 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#1E3A5F] flex items-center justify-center mb-4 text-[#64748B] text-2xl">🔍</div>
                <h3 className="text-xl font-medium mb-2">{t.previewTitle}</h3>
                <p className="text-[#64748B] max-w-xs">{t.previewDesc}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-syne font-bold mb-6">{t.liveEstimates}</h3>
                {mfHoldings.map(holding => {
                  let expRatio = holding.isLive ? (holding.expenseRatio || 1.5) : 0;
                  let directExpRatio = holding.isLive ? Math.max(0.1, expRatio - 1.0) : 0;
                  let shortName = holding.isLive ? holding.schemeName : '';

                  if (!holding.isLive) {
                    const fund = searchFunds('').find(f => f.id === holding.fundId);
                    const directFund = getDirectEquivalent(holding.fundId);
                    if (fund && directFund) {
                      expRatio = fund.expenseRatio;
                      directExpRatio = directFund.expenseRatio;
                      shortName = fund.shortName;
                    }
                  }
                  
                  const saving = holding.investedAmount * (expRatio - directExpRatio) / 100;
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={holding.fundId} 
                      className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-5 border-l-4 border-l-[#F59E0B]"
                    >
                      <div className="text-sm text-[#94A3B8] mb-1">{t.prelimEstimate}</div>
                      <div className="font-medium text-lg mb-4 line-clamp-1">{shortName}</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">{t.annualDrain}</div>
                          <div className="text-xl text-red-400 font-mono">₹{Math.round(holding.investedAmount * expRatio / 100).toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">{t.ifSwitched}</div>
                          <div className="text-xl text-green-400 font-mono">{t.savePerYr} ₹{Math.round(saving).toLocaleString('en-IN')}/yr</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}

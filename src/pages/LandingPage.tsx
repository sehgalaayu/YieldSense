import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { getFDRates, FDProduct } from '../lib/fdService';
import { calculateYield } from '../lib/calculator';
import { useUserStore } from '../store/userStore';
import { translations } from '../lib/translations';

export default function LandingPage() {
  const language = useUserStore((state) => state.language);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fds' | 'mf'>('fds');
  const [topFDs, setTopFDs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language].hero;
  const f = translations[language].features;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once visible, stop observing — no re-animation
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,      // Trigger when 12% of element is visible
        rootMargin: '0px 0px -40px 0px'  // Trigger slightly before element reaches viewport bottom
      }
    );

    // Observe all elements with reveal classes
    const revealElements = document.querySelectorAll(
      '.reveal, .reveal-slow, .reveal-fade'
    );
    revealElements.forEach((el) => observer.observe(el));

    const loadTopFDs = async () => {
      const allFDs = await getFDRates();
      const processed = allFDs
        .filter(p => p.tenor === 12)
        .map(p => {
          const res = calculateYield({
            principal: 100000,
            tenorMonths: 12,
            grossRate: p.grossRate,
            taxSlab: 20,
            interestType: 'Cumulative'
          });
          return {
            name: p.bankName,
            rate: p.grossRate.toFixed(2),
            postTaxYield: res.effectiveAnnualYield.toFixed(2),
            color: p.grossRate > 8 ? 'accent-gold' : p.grossRate > 7 ? 'accent-blue' : 'accent-green'
          };
        })
        .sort((a, b) => parseFloat(b.postTaxYield) - parseFloat(a.postTaxYield))
        .slice(0, 3);
      
      setTopFDs(processed);
      setLoading(false);
    };
    loadTopFDs();

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 20% 40%, rgba(26, 86, 219, 0.12) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
                       #0A0F1E`
        }}>

        {/* Animated grid overlay */}
        <div className="hero-grid-bg absolute inset-0 pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-12 items-center">

            {/* Left Column — Headline */}
            <div style={{ overflow: 'visible' }}>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E3A5F] bg-[#0D1A2E] mb-6 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">
                  {language === 'hi' ? 'लाइव FD इंटेलिजेंस · भारत' : 'Live FD Intelligence · India'}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="animate-fade-in-up-delay-1">
                <span className="block text-[#F1F5F9] font-syne font-extrabold leading-[1.0]"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
                  {t.title1}
                </span>
                <span className="block font-syne font-extrabold text-[#F59E0B] leading-[1.0] underline decoration-[#F59E0B] underline-offset-[6px]"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
                  {t.title2}
                </span>
              </h1>

              {/* Subline */}
              <p className="mt-5 text-[#1A56DB] font-sans text-lg font-medium animate-fade-in-up-delay-2">
                {t.subtitle}
              </p>

              {/* Description */}
              <p className="mt-3 text-[#64748B] text-base max-w-md leading-relaxed animate-fade-in-up-delay-2">
                {t.description}
              </p>

              {/* CTA Row */}
              <div className="flex gap-3 mt-8 flex-wrap animate-fade-in-up-delay-3">
                <button onClick={() => navigate('/onboarding')}
                  className="px-5 py-3 bg-[#F59E0B] text-black font-bold rounded-lg hover:bg-[#D97706] transition-all hover:scale-105">
                  {t.ctaFD}
                </button>
                <button onClick={() => navigate('/mf')}
                  className="px-5 py-3 bg-[#1A56DB] text-white font-bold rounded-lg hover:bg-[#1648C0] transition-all hover:scale-105">
                  {t.ctaMF}
                </button>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 pt-6 border-t border-[#1E3A5F] animate-fade-in-up-delay-4">
                {(language === 'hi' ? [
                  'टैक्स बाद FD यील्ड',
                  'MF एक्सपेंस रेश्यो विश्लेषण',
                  'एआई सलाहकार',
                  'हिंदी + अंग्रेजी'
                ] : [
                  'Post-Tax FD Yields',
                  'MF Expense Ratio Analysis',
                  'AI Advisor',
                  'Hindi + English'
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">✓</span>
                    <span className="text-[#64748B] text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column — Intelligence Card */}
            <div className="relative isolate animate-fade-in-up-delay-3 max-w-[420px] ml-auto w-full">
              {/* Glow effect */}
              <div className="absolute -inset-5 -z-10 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(26,86,219,0.25) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              <div className="relative z-10 rounded-2xl border border-[#1E3A5F] bg-[#0D1A2E]/90 backdrop-blur-sm p-5"
                style={{ boxShadow: '0 0 40px rgba(26,86,219,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest">Live Intelligence</span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#112240] text-[#3B82F6] px-2 py-1 rounded border border-[#1E3A5F]">BETA 2026</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 p-1 bg-[#0A0F1E] rounded-lg border border-[#1E3A5F]">
                  <button onClick={() => setActiveTab('fds')} className={`flex-1 py-1.5 text-xs font-semibold rounded ${activeTab === 'fds' ? 'bg-[#1A56DB] text-white' : 'text-[#64748B] hover:text-[#94A3B8]'}`}>FDs</button>
                  <button onClick={() => setActiveTab('mf')} className={`flex-1 py-1.5 text-xs font-semibold rounded ${activeTab === 'mf' ? 'bg-[#1A56DB] text-white' : 'text-[#64748B] hover:text-[#94A3B8]'}`}>Mutual Funds</button>
                </div>

                {activeTab === 'fds' ? (
                  <>
                {loading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-16 bg-[#112240] rounded-lg"/>
                    <div className="h-14 bg-[#112240] rounded-lg opacity-60"/>
                    <div className="h-14 bg-[#112240] rounded-lg opacity-40"/>
                  </div>
                ) : (
                  <>
                {/* Top FD row — highlighted */}
                {topFDs[0] && (
                  <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 mb-2 relative overflow-hidden">
                    <div className="absolute top-0 w-[60%] h-full"
                      style={{
                        left: '-100%',
                        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent)',
                        animation: 'shimmer 3s ease-in-out infinite',
                      }}
                    />
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="text-[#F1F5F9] text-sm font-semibold">{topFDs[0].name}</p>
                        <p className="text-[#64748B] text-xs">{language === 'hi' ? '12 महीने अवधि' : '12 Months Tenor'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F1F5F9] font-mono font-bold text-lg">{topFDs[0].rate}%</p>
                        <p className="text-[#F59E0B] text-xs font-mono">{language === 'hi' ? 'टैक्स बाद' : 'Post-Tax'}: {topFDs[0].postTaxYield}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rows 2 and 3 — subdued */}
                {topFDs.slice(1).map((fd, i) => (
                  <div key={i} className="rounded-lg bg-[#112240] p-3 mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[#94A3B8] text-sm font-medium">{fd.name}</p>
                        <p className="text-[#64748B] text-xs">{language === 'hi' ? '12 महीने अवधि' : '12 Months Tenor'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#94A3B8] font-mono font-semibold">{fd.rate}%</p>
                        <p className="text-[#10B981] text-xs font-mono">{language === 'hi' ? 'टैक्स बाद' : 'Post-Tax'}: {fd.postTaxYield}%</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* AI insight */}
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[#0A0F1E] border border-[#1E3A5F]">
                  <div className="w-6 h-6 rounded-full bg-[#1A56DB] flex items-center justify-center flex-shrink-0 text-xs text-white font-bold">AI</div>
                  <p className="text-[#64748B] text-xs leading-relaxed italic">
                    {language === 'hi'
                      ? '"आपके 30% टैक्स स्लैब पर, Suryoday SBI के स्पेशल FD से बेहतर नेट रिटर्न देता है।"'
                      : '"At your 30% tax slab, Suryoday offers better net returns than SBI\'s Special FD."'
                    }
                  </p>
                </div>
                  </>
                )}
                  </>
                ) : (
                  <>
                    {/* MF content */}
                    {[
                      { name: 'Mirae Asset Large Cap — Regular', exp: '1.52%', save: '₹18,400/yr' },
                      { name: 'HDFC Flexi Cap — Regular', exp: '1.68%', save: '₹20,160/yr' },
                      { name: 'Axis Bluechip — Regular', exp: '1.45%', save: '₹17,400/yr' },
                    ].map((mf, i) => (
                      <div key={i} className="rounded-lg bg-[#112240] p-3 mb-2 border border-[#1E3A5F]/50">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[#F1F5F9] text-sm font-medium">{mf.name}</p>
                          <p className="text-[#EF4444] text-xs font-mono">{mf.exp} exp</p>
                        </div>
                        <div className="mt-2 text-right">
                          <p className="text-[#10B981] text-xs font-semibold">
                            {language === 'hi' ? `डायरेक्ट में स्विच करें: बचाएं ${mf.save}` : `Switch to Direct: save ${mf.save}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Bottom: timestamp */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#1E3A5F] uppercase">Updated · Apr 2026</span>
                  <button onClick={() => navigate('/compare')} className="text-[10px] text-[#1A56DB] hover:text-[#3B82F6] font-mono transition-colors">
                    {language === 'hi' ? 'सभी 34+ FDs देखें →' : 'View all 34+ FDs →'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — STATS BAR
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#1E3A5F] bg-[#0D1A2E]/50 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1E3A5F] reveal">
          {[
            {
              value: '10+',
              label: language === 'hi' ? 'पार्टनर बैंक' : 'Partner Banks',
              sub: 'PSU · Private · SFB · NBFC'
            },
            {
              value: '34+',
              label: language === 'hi' ? 'FD उत्पाद' : 'FD Products',
              sub: language === 'hi' ? '5 अवधियों में' : 'Across 5 tenors'
            },
            {
              value: '₹1.2L',
              label: 'Avg Annual Saving',
              sub: 'by Switching to Direct MF'
            },
          ].map((stat, i) => {
            const delayClasses = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];
            return (
            <div key={i} className={`px-8 py-4 md:py-0 text-center reveal ${delayClasses[i % 3]}`}>
              <p className="font-mono font-bold text-3xl text-[#1A56DB]">{stat.value}</p>
              <p className="text-[#F1F5F9] text-sm font-medium mt-1">{stat.label}</p>
              <p className="text-[#64748B] text-xs mt-0.5">{stat.sub}</p>
            </div>
          )})}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — FEATURES
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A0F1E] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-syne text-4xl font-bold text-center mb-12 text-[#F1F5F9] reveal">
            {language === 'hi' ? 'अलग बनाया गया। क्योंकि FDs बेहतर डिज़र्व करते हैं।' : 'Built different. Because FDs deserve better.'}
          </h2>

          {/* Feature 1 — AI Advisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 border-b border-[#1E3A5F] reveal">
            <div className="reveal reveal-delay-1">
              <span className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest">01 / AI Advisor</span>
              <h3 className="text-2xl font-syne font-bold text-[#F1F5F9] mt-2 leading-tight">
                {language === 'hi' ? 'हिंदी में पूछें। ऐसे जवाब पाएं जो समझ आएं।' : 'Ask in Hindi. Get answers that make sense.'}
              </h3>
              <p className="text-[#64748B] mt-3 leading-relaxed">
                {language === 'hi'
                  ? 'अधिकांश FD प्लेटफ़ॉर्म मानते हैं कि आप जानते हैं कि "p.a." का मतलब क्या है, TDS क्या है, या Small Finance Bank 9% क्यों देता है जबकि SBI 7% देता है। हमारा AI यह सब समझाता है — आपकी भाषा में।'
                  : 'Most FD platforms assume you know what "p.a." means, what TDS is, or why a Small Finance Bank offers 9% when SBI offers 7%. Our AI explains all of it — in the language and tone that works for you.'
                }
              </p>
              <div className="flex gap-3 mt-4">
                {['Hindi', 'English', language === 'hi' ? 'सरल भाषा' : 'Jargon-free'].map((tag) => (
                  <span key={tag} className="px-3 py-1 text-xs rounded-full border border-[#1E3A5F] text-[#64748B]">{tag}</span>
                ))}
              </div>
            </div>
            {/* Mini chat preview */}
            <div className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-4 reveal reveal-delay-2">
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#1A56DB] text-white text-sm px-3 py-2 rounded-lg rounded-tr-sm max-w-[80%]">
                    Suryoday SFB safe hai kya?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1A56DB] flex items-center justify-center text-xs text-white flex-shrink-0">AI</div>
                  <div className="bg-[#112240] border-l-2 border-[#1A56DB] text-[#94A3B8] text-sm px-3 py-2 rounded-lg rounded-tl-sm max-w-[80%]">
                    हाँ! Suryoday DICGC insured है — मतलब ₹5 लाख तक आपका पैसा 100% safe है। यह RBI-regulated Small Finance Bank है।
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 — Tax Intelligence (right-heavy) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 border-b border-[#1E3A5F] reveal">
            {/* Mini calculator preview */}
            <div className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-5 order-2 md:order-1 reveal reveal-delay-1">
              <p className="text-xs font-mono text-[#64748B] uppercase mb-3">₹1,00,000 · 12M · 30% Tax Slab</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B] text-sm">{language === 'hi' ? 'सकल परिपक्वता' : 'Gross Maturity'}</span>
                  <span className="font-mono text-[#F1F5F9]">₹1,07,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] text-sm">{language === 'hi' ? 'TDS कटौती' : 'TDS Deducted'}</span>
                  <span className="font-mono text-red-400">-₹750</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] text-sm">{language === 'hi' ? 'स्लैब टैक्स' : 'Slab Tax'}</span>
                  <span className="font-mono text-red-400">-₹1,500</span>
                </div>
                <div className="border-t border-[#1E3A5F] pt-2 flex justify-between">
                  <span className="text-[#F1F5F9] font-medium text-sm">{language === 'hi' ? 'नेट परिपक्वता' : 'Net Maturity'}</span>
                  <span className="font-mono font-bold text-[#F59E0B] text-lg">₹1,05,250</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 reveal reveal-delay-2">
              <span className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest">02 / Tax Intelligence</span>
              <h3 className="text-2xl font-syne font-bold text-[#F1F5F9] mt-2 leading-tight">
                {language === 'hi' ? 'बैंक ग्रॉस रेट दिखाते हैं। हम दिखाते हैं कि आपके अकाउंट में क्या आता है।' : 'Banks show gross rates. We show what hits your account.'}
              </h3>
              <p className="text-[#64748B] mt-3 leading-relaxed">
                {language === 'hi'
                  ? 'TDS, इनकम स्लैब टैक्स, इफेक्टिव यील्ड — हम आपके सही टैक्स ब्रैकेट के लिए सब कैलकुलेट करते हैं। 30% टैक्स स्लैब पर 7.5% FD, 0% पर 6.8% FD से कम देता है।'
                  : 'TDS, income slab tax, effective yield — we calculate it all for your exact tax bracket. A 7.5% FD at 30% tax slab nets you less than a 6.8% FD at 0%. We show you the truth.'
                }
              </p>
            </div>
          </div>

          {/* Feature 3 — Safety Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 reveal">
            <div className="reveal reveal-delay-1">
              <span className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest">03 / Safety Scores</span>
              <h3 className="text-2xl font-syne font-bold text-[#F1F5F9] mt-2 leading-tight">
                {language === 'hi' ? 'बुक करने से पहले जानें — क्या बीमित है।' : 'Know exactly what\'s insured — before you book.'}
              </h3>
              <p className="text-[#64748B] mt-3 leading-relaxed">
                {language === 'hi'
                  ? 'DICGC प्रति बैंक ₹5 लाख तक कवर करता है। Bajaj Finance जैसी NBFCs कवर नहीं हैं। हम हर FD को स्पष्ट रूप से लेबल करते हैं ताकि आप अपना जोखिम जानें।'
                  : 'DICGC covers up to ₹5 lakh per bank. NBFCs like Bajaj Finance are NOT covered. We label every FD clearly so you know your risk before your money moves.'
                }
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-xs">●</span>
                  <span className="text-[#64748B] text-xs">
                    {language === 'hi' ? 'DICGC बीमित — SBI, HDFC, Suryoday SFB और सभी अनुसूचित बैंक' : 'DICGC Insured — SBI, HDFC, Suryoday SFB and all scheduled banks'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">●</span>
                  <span className="text-[#64748B] text-xs">
                    {language === 'hi' ? 'बीमित नहीं — Bajaj Finance, Shriram Finance (NBFCs)' : 'Not Insured — Bajaj Finance, Shriram Finance (NBFCs)'}
                  </span>
                </div>
              </div>
            </div>
            {/* DICGC visual */}
            <div className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-5 reveal reveal-delay-2">
              {[
                { bank: 'Suryoday SFB', type: 'Small Finance Bank', insured: true, rate: '8.50%' },
                { bank: 'Jana SFB', type: 'Small Finance Bank', insured: true, rate: '8.25%' },
                { bank: 'Bajaj Finance', type: 'NBFC', insured: false, rate: '8.10%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#1E3A5F] last:border-0">
                  <div>
                    <p className="text-[#94A3B8] text-sm">{item.bank}</p>
                    <p className="text-[#64748B] text-xs">{item.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#F1F5F9] text-sm">{item.rate}</span>
                    {item.insured
                      ? <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/50 px-2 py-0.5 rounded-full">DICGC ✓</span>
                      : <span className="text-xs bg-red-900/30 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full">{language === 'hi' ? 'बीमित नहीं' : 'Not Insured'}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 4 — MF Optimization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 reveal">
            <div className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-6 order-2 md:order-1 reveal reveal-delay-1 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-green-500/30 flex items-center justify-center text-green-400 font-mono font-bold text-xl">
                  84
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F1F5F9]">Portfolio Health Score</p>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-widest">Optimized for Direct Plans</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#112240] rounded-lg border border-[#1E3A5F] flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">Annual Savings</span>
                  <span className="text-green-400 font-bold">₹24,500/yr</span>
                </div>
                <div className="p-3 bg-[#112240] rounded-lg border border-[#1E3A5F] flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">10Y Wealth Gain</span>
                  <span className="text-accent-gold font-bold">+₹4.2 Lakhs</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 reveal reveal-delay-2">
              <span className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest">04 / MF Optimization</span>
              <h3 className="text-2xl font-syne font-bold text-[#F1F5F9] mt-2 leading-tight">
                {language === 'hi' ? 'कमीशन हटाएँ। अधिक धन बनाएँ।' : 'Kill commissions. Build massive wealth.'}
              </h3>
              <p className="text-[#64748B] mt-3 leading-relaxed">
                {language === 'hi'
                  ? 'अधिकांश निवेशक अनजाने में "Regular" प्लान्स में 1.5% तक कमीशन देते हैं। हम आपके पोर्टफोलियो को स्कैन करते हैं और बताते हैं कि "Direct" में स्विच करके आप अगले 10 सालों में कितने लाख बचा सकते हैं।'
                  : 'Most investors lose up to 1.5% every year in "Regular" plan commissions without even knowing it. We scan your portfolio and show you exactly how many lakhs you can save over 10 years by switching to Direct plans.'
                }
              </p>
              <button onClick={() => navigate('/mf')} className="mt-4 text-accent-blue text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Check MF Health Score →
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — SOCIAL PROOF
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0D1A2E] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-syne text-4xl font-bold text-center mb-16 text-[#F1F5F9] reveal">
            {language === 'hi' ? 'पूरे भारत के निवेशकों से' : 'From investors across India'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 reveal">
            {[
              { quote: "Suryoday ka FD choose kiya YieldSense ki wajah se — ₹12,000 zyada milenge!", name: "Priya K.", location: "Pune, Maharashtra", highlight: true },
              { quote: "Finally understood what TDS meant for my dad's savings. The Hindi support is incredible.", name: "Aman S.", location: "New Delhi", highlight: false },
              { quote: "The comparison table is a game changer. All I need is 2 mins to find the best yield.", name: "Rajesh T.", location: "Bangalore", highlight: false },
              { quote: "Mere tax slab ke hisaab se best FD batata hai — koi dusra app yeh nahi karta.", name: "Sunita V.", location: "Jaipur, Rajasthan", highlight: false },
              { quote: "DICGC coverage indicator saved me from putting ₹8L in an uninsured NBFC.", name: "Karthik M.", location: "Chennai", highlight: false },
              { quote: "Built for real India. Not just English-speaking metro users.", name: "Deepa R.", location: "Nagpur, Maharashtra", highlight: false },
            ].map((testimonial, i) => {
              const delayClasses = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];
              return (
              <div key={i} className={`rounded-xl border p-5 transition-all hover:scale-[1.02] ${testimonial.highlight ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5' : 'border-[#1E3A5F] bg-[#0A0F1E]'} reveal ${delayClasses[i % 3]}`}>
                <p className="text-[#94A3B8] text-sm leading-relaxed">"{testimonial.quote}"</p>
                <div className="mt-3">
                  <p className="text-[#F1F5F9] text-xs font-medium">— {testimonial.name}</p>
                  <p className="text-[#64748B] text-xs">{testimonial.location}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — BOTTOM CTA
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-[#0A0F1E]">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(26,86,219,0.1) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <p className="text-xs font-mono text-[#1A56DB] uppercase tracking-widest mb-4 reveal">
            {language === 'hi' ? 'स्मार्ट निवेश के लिए तैयार?' : 'Ready to invest smarter?'}
          </p>
          <h2 className="font-syne text-[#F1F5F9] mb-4 reveal reveal-slow reveal-delay-1" style={{ fontWeight: 900, fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', textWrap: 'balance' }}>
            {language === 'hi' ? '2 मिनट में अपना सबसे अच्छा FD खोजें।' : 'Find your best FD in 2 minutes.'}
          </h2>
          <p className="text-[#64748B] mb-8 max-w-md mx-auto reveal reveal-delay-2">
            {language === 'hi'
              ? 'अपनी राशि, अवधि और टैक्स स्लैब बताएं। हम आपको दिखाएंगे कि कौन सा FD सबसे ज़्यादा पैसा आपके अकाउंट में डालता है।'
              : 'Tell us your amount, horizon, and tax slab. We\'ll show you exactly which FD puts the most money in your account.'
            }
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="cta-shimmer px-8 py-4 bg-[#F59E0B] text-black font-bold text-lg rounded-xl hover:bg-[#D97706] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#F59E0B]/15 reveal reveal-delay-3"
          >
            {language === 'hi' ? 'शुरू करें — यह मुफ़्त है →' : 'Get Started — It\'s Free →'}
          </button>
          <p className="text-[#64748B] text-xs mt-4 reveal reveal-delay-4">
            {language === 'hi' ? 'कोई साइनअप नहीं। कोई बैंक क्रेडेंशियल नहीं चाहिए।' : 'No signup required. No bank credentials needed.'}
          </p>
        </div>
      </section>

    </div>
  );
}

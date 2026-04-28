import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

export default function MFLandingPage() {
  const navigate = useNavigate();
  const language = useUserStore((state) => state.language);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const revealElements = document.querySelectorAll(
      '.reveal, .reveal-slow, .reveal-fade'
    );
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pb-20">
      
      {/* SECTION 1 — Hero */}
      <section className="pt-24 pb-16 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-syne font-extrabold mb-6 leading-tight animate-fade-in-up">
          {language === 'hi' ? 'क्या आपके Mutual Funds में छुपी हुई Fees हैं?' : 'Are you paying hidden fees on your Mutual Funds?'}
        </h1>
        <p className="text-xl md:text-2xl text-[#F59E0B] font-medium mb-4 max-w-4xl mx-auto animate-fade-in-up-delay-1">
          {language === 'hi' ? 'Regular plan में निवेश करने वाले अधिकांश भारतीय 20 वर्षों में वितरक कमीशन में ₹10-20 लाख खो देते हैं। 2 मिनट में अपना नुकसान देखें।' : 'Most Indians in Regular plans lose ₹10-20 lakh over 20 years to distributor commissions. See your number in 2 minutes.'}
        </p>
        <p className="text-lg text-[#94A3B8] mb-10 max-w-2xl mx-auto animate-fade-in-up-delay-2">
          {language === 'hi' ? 'अपने पोर्टफोलियो की जांच करें।' : 'Check if your Regular MFs have hidden fees.'}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up-delay-3">
          <button 
            onClick={() => navigate('/mf/analyze')}
            className="px-8 py-4 bg-[#F59E0B] text-black font-bold rounded-lg hover:bg-[#D97706] transition-all hover:scale-105 shadow-lg shadow-[#F59E0B]/20"
          >
            {language === 'hi' ? 'मेरी होल्डिंग्स का विश्लेषण करें →' : 'Analyze My Holdings →'}
          </button>
          <button 
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 border border-[#1E3A5F] text-[#94A3B8] font-bold rounded-lg hover:border-[#3B82F6] hover:text-white transition-all"
          >
            {language === 'hi' ? 'यह कैसे काम करता है देखें ↓' : 'See How It Works ↓'}
          </button>
        </div>
      </section>

      {/* SECTION 2 — The Problem */}
      <section className="py-12 bg-[#112240] border-y border-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
            <div className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-1">
              <div className="text-4xl font-mono text-[#EF4444] font-bold mb-2">1.5%</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{language === 'hi' ? 'औसत Regular प्लान expense ratio' : 'Average Regular plan expense ratio'}</div>
              <div className="text-sm text-[#64748B]">{language === 'hi' ? 'वितरक को भुगतान' : 'Paying the distributor'}</div>
            </div>
            <div className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-2">
              <div className="text-4xl font-mono text-[#10B981] font-bold mb-2">0.4%</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{language === 'hi' ? 'औसत Direct प्लान expense ratio' : 'Average Direct plan expense ratio'}</div>
              <div className="text-sm text-[#64748B]">{language === 'hi' ? 'अपना पैसा बचाना' : 'Keeping your money'}</div>
            </div>
            <div className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-3">
              <div className="text-4xl font-mono text-[#F59E0B] font-bold mb-2">₹18L+</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{language === 'hi' ? 'कमीशन में नुकसान' : 'Lost to commissions'}</div>
              <div className="text-sm text-[#64748B]">{language === 'hi' ? '20 वर्षों में ₹10L पर' : 'on ₹10L over 20 years'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — How It Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto reveal">
        <h2 className="text-3xl font-syne font-bold text-center mb-16">{language === 'hi' ? 'WealthSense आपकी कैसे मदद करता है' : 'How WealthSense Helps You Switch'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[16.6%] right-[16.6%] h-0.5 bg-[#1E3A5F] -translate-y-1/2 z-0" />
          
          {[
            { step: '01', title: language === 'hi' ? 'अपने फंड का नाम दर्ज करें' : 'Enter your fund name', desc: language === 'hi' ? 'लोकप्रिय फंडों के हमारे डेटाबेस से खोजें।' : 'Search from our database of popular funds.' },
            { step: '02', title: language === 'hi' ? 'अपनी वास्तविक लागत देखें' : 'See your real cost', desc: language === 'hi' ? 'हम expense ratio, वार्षिक नुकसान, और 20-वर्षीय प्रभाव दिखाते हैं।' : 'We show expense ratio, annual ₹ drain, and 20-year impact.' },
            { step: '03', title: language === 'hi' ? 'एक क्लिक में स्विच करें' : 'Switch in one click', desc: language === 'hi' ? 'सटीक Direct वेरिएंट के साथ तुलना और सुरक्षित रूप से स्विच करने का तरीका।' : 'Direct comparison with exact Direct variant + how to switch safely.' }
          ].map((item, i) => (
            <div key={i} className={`relative z-10 flex flex-col items-center text-center reveal reveal-delay-${(i % 3) + 1}`}>
              <div className="w-16 h-16 rounded-full bg-[#1A56DB] text-white flex items-center justify-center text-2xl font-bold mb-6 border-4 border-[#0A0F1E]">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-[#94A3B8]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Live Example Card */}
      <section className="py-16 bg-gradient-to-b from-[#0A0F1E] to-[#112240]">
        <div className="max-w-4xl mx-auto px-6 reveal">
          <div className="bg-[#0A0F1E] rounded-2xl border border-[#1E3A5F] p-8 shadow-2xl reveal-slow">
            <h3 className="text-xl font-medium text-center mb-2">{language === 'hi' ? 'लाइव उदाहरण: Mirae Asset Large Cap' : 'Live Example: Mirae Asset Large Cap'}</h3>
            <p className="text-[#94A3B8] text-center mb-8">{language === 'hi' ? '₹1,00,000 के निवेश पर' : 'On an investment of ₹1,00,000'}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="text-red-400 font-mono text-sm mb-1 uppercase tracking-wider">{language === 'hi' ? 'Regular प्लान' : 'Regular Plan'}</div>
                <div className="text-3xl font-bold mb-4">1.52% <span className="text-sm font-normal text-[#94A3B8]">expense</span></div>
                <div className="text-[#F1F5F9]">{language === 'hi' ? '₹1,520 / वर्ष का नुकसान' : '₹1,520 / year drain'}</div>
              </div>
              
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 relative">
                <div className="absolute -top-3 -right-3 bg-[#10B981] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {language === 'hi' ? 'आपको यहाँ होना चाहिए' : 'YOU SHOULD BE HERE'}
                </div>
                <div className="text-green-400 font-mono text-sm mb-1 uppercase tracking-wider">{language === 'hi' ? 'Direct प्लान' : 'Direct Plan'}</div>
                <div className="text-3xl font-bold mb-4">0.54% <span className="text-sm font-normal text-[#94A3B8]">expense</span></div>
                <div className="text-[#F1F5F9]">{language === 'hi' ? '₹540 / वर्ष का नुकसान' : '₹540 / year drain'}</div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-[#1A56DB]/10 rounded-xl border border-[#1A56DB]/30">
              <p className="text-lg font-medium text-[#3B82F6] mb-2">
                {language === 'hi' ? 'आप बचाते हैं:' : 'You save:'} <span className="font-bold text-[#F1F5F9]">{language === 'hi' ? '₹980/वर्ष' : '₹980/year'}</span> → <span className="font-bold text-[#F1F5F9]">₹14,200</span> {language === 'hi' ? '10 वर्षों में' : 'over 10 years'} → <span className="font-bold text-[#F1F5F9]">₹48,000</span> {language === 'hi' ? '20 वर्षों में' : 'over 20 years'}
              </p>
              <p className="text-sm text-[#94A3B8]">{language === 'hi' ? 'यह असली पैसा है। प्रतिशत नहीं।' : 'This is real money. Not percentages.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Fund categories we cover */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center reveal">
        <h3 className="text-2xl font-syne font-bold mb-4">{language === 'hi' ? 'श्रेणियाँ जिन्हें हम कवर करते हैं' : 'Categories We Cover'}</h3>
        <p className="text-[#94A3B8] mb-8">{language === 'hi' ? '15 फंड जोड़े। 30 फंड। सभी लोकप्रिय फंड जो भारतीय वास्तव में रखते हैं।' : '15 fund pairs. 30 funds. All the popular ones Indians actually hold.'}</p>
        
        <div className="flex flex-wrap justify-center gap-3">
          {['Large Cap', 'Flexi Cap', 'Mid Cap', 'Small Cap', 'ELSS', 'Index Funds', 'Debt', 'Hybrid'].map((cat, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-[#1E3A5F]/50 border border-[#1E3A5F] text-[#F1F5F9] text-sm reveal reveal-delay-1">
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="py-24 px-6 text-center bg-[#112240] border-t border-[#1E3A5F] reveal">
        <h2 className="text-3xl md:text-5xl font-syne font-bold mb-6">{language === 'hi' ? 'कमीशन टैक्स देना बंद करें।' : 'Stop paying the commission tax.'}</h2>
        <p className="text-xl text-[#94A3B8] mb-10">{language === 'hi' ? 'आज ही शुरू करें।' : 'Start today.'}</p>
        <button 
          onClick={() => navigate('/mf/analyze')}
          className="px-10 py-5 bg-[#F59E0B] text-black text-lg font-bold rounded-xl hover:bg-[#D97706] transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)] reveal reveal-delay-2"
        >
          {language === 'hi' ? 'मेरे Mutual Funds का विश्लेषण करें →' : 'Analyze My Mutual Funds →'}
        </button>
      </section>
      
    </div>
  );
}

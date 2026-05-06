import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { motion } from 'motion/react';
import { translations } from '../lib/translations';

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

  const t = translations[language].mfLanding;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden min-h-screen bg-[#0A0F1E] text-[#F1F5F9] pb-20"
    >
      
      {/* SECTION 1 — Hero */}
      <section className="pt-24 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight tracking-tight"
        >
          {t.title1}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-[#F59E0B] font-medium mb-4 max-w-4xl mx-auto"
        >
          {t.subtitle}
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-[#94A3B8] mb-10 max-w-2xl mx-auto"
        >
          {t.desc}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/mf/analyze')}
            className="px-8 py-4 bg-[#F59E0B] text-black font-bold rounded-lg hover:bg-[#D97706] transition-all shadow-lg shadow-[#F59E0B]/20"
          >
            {t.analyzeBtn}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 border border-[#1E3A5F] text-[#94A3B8] font-bold rounded-lg hover:border-[#3B82F6] hover:text-white transition-all"
          >
            {t.howItWorksBtn}
          </motion.button>
        </motion.div>
      </section>

      {/* SECTION 2 — The Problem */}
      <section className="py-12 bg-[#112240] border-y border-[#1E3A5F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
            <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-1">
              <div className="text-4xl font-mono text-[#EF4444] font-bold mb-2">1.5%</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{t.stats.regular}</div>
              <div className="text-sm text-[#64748B]">{t.stats.regularSub}</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-2">
              <div className="text-4xl font-mono text-[#10B981] font-bold mb-2">0.4%</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{t.stats.direct}</div>
              <div className="text-sm text-[#64748B]">{t.stats.directSub}</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-[#0A0F1E] p-6 rounded-xl border border-[#1E3A5F] text-center reveal reveal-delay-3">
              <div className="text-4xl font-mono text-[#F59E0B] font-bold mb-2">₹18L+</div>
              <div className="text-[#F1F5F9] font-medium mb-1">{t.stats.loss}</div>
              <div className="text-sm text-[#64748B]">{t.stats.lossSub}</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — How It Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto reveal">
        <h2 className="text-3xl font-heading font-black text-center mb-16 tracking-tight">{t.howItWorks.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[16.6%] right-[16.6%] h-0.5 bg-[#1E3A5F] -translate-y-1/2 z-0" />
          
          {[
            { step: '01', title: t.howItWorks.s1Title, desc: t.howItWorks.s1Desc },
            { step: '02', title: t.howItWorks.s2Title, desc: t.howItWorks.s2Desc },
            { step: '03', title: t.howItWorks.s3Title, desc: t.howItWorks.s3Desc }
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
          <motion.div whileHover={{ scale: 1.02 }} className="bg-[#0A0F1E] rounded-2xl border border-[#1E3A5F] p-8 shadow-2xl reveal-slow">
            <h3 className="text-xl font-medium text-center mb-2">{t.example.title}</h3>
            <p className="text-[#94A3B8] text-center mb-8">{t.example.subtitle}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="text-red-400 font-mono text-sm mb-1 uppercase tracking-wider">{t.example.regular}</div>
                <div className="text-3xl font-bold mb-4">1.52% <span className="text-sm font-normal text-[#94A3B8]">expense</span></div>
                <div className="text-[#F1F5F9]">₹1,520 / yr {t.example.drain}</div>
              </div>
              
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 relative">
                <div className="absolute -top-3 -right-3 bg-[#10B981] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {t.example.shouldBe}
                </div>
                <div className="text-green-400 font-mono text-sm mb-1 uppercase tracking-wider">{t.example.direct}</div>
                <div className="text-3xl font-bold mb-4">0.54% <span className="text-sm font-normal text-[#94A3B8]">expense</span></div>
                <div className="text-[#F1F5F9]">₹540 / yr {t.example.drain}</div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-[#1A56DB]/10 rounded-xl border border-[#1A56DB]/30">
              <p className="text-lg font-medium text-[#3B82F6] mb-2">
                {t.example.save1} <span className="font-bold text-[#F1F5F9]">₹980/yr</span> → <span className="font-bold text-[#F1F5F9]">₹14,200</span> {t.example.save10} → <span className="font-bold text-[#F1F5F9]">₹48,000</span> {t.example.save20}
              </p>
              <p className="text-sm text-[#94A3B8]">{t.example.realMoney}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — Fund categories we cover */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center reveal">
        <h3 className="text-2xl font-heading font-bold mb-4">{t.categories.title}</h3>
        <p className="text-[#94A3B8] mb-8">{t.categories.desc}</p>
        
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
        <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 tracking-tight">{t.cta.title}</h2>
        <p className="text-xl text-[#94A3B8] mb-10">{t.cta.subtitle}</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/mf/analyze')}
          className="px-10 py-5 bg-[#F59E0B] text-black text-lg font-bold rounded-xl hover:bg-[#D97706] transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] reveal reveal-delay-2"
        >
          {t.cta.btn}
        </motion.button>
      </section>
      
    </motion.div>
  );
}

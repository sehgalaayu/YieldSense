import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStore } from '../store/userStore';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { translations } from '../lib/translations';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { chatMessages, addChatMessage, language, setLanguage, principal, tenorMonths, taxSlab, recommendedFDs, mfHoldings, mfAnalysisResults, user } = useUserStore();
  const [showAuth, setShowAuth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[language].chat;
  
  const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
  const isLocked = !user && userMessageCount >= 3;
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { prompt } = customEvent.detail;
      setIsOpen(true);
      if (prompt) {
        // We'll wrap in setTimeout to allow drawer to animate open first
        setTimeout(() => {
          handleSend(prompt);
        }, 300);
      }
    };

    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, [isOpen, isTyping, chatMessages, language]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    if (isLocked) {
      setShowAuth(true);
      return;
    }

    const userMsg = { role: 'user' as const, content: textToSend };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          userContext: { principal, tenorMonths, taxSlab, recommendedFDs, mfHoldings, mfAnalysisResults },
          language
        }),
      });

      if (!response.ok) throw new Error('Failed to chat');

      const data = await response.json();
      addChatMessage({ role: 'assistant', content: data.reply });
    } catch (error) {
      console.error(error);
      addChatMessage({ role: 'assistant', content: language === 'hi' ? 'क्षमा करें, मुझे इस समय जुड़ने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें।' : 'Sorry, I am having trouble connecting right now. Please try again later.' });
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedPrompts = [
    { en: "Which FD gives highest post-tax return?", hi: "सबसे ज़्यादा पोस्ट-टैक्स रिटर्न किस FD में है?" },
    { en: "Is Suryoday SFB safe?", hi: "क्या Suryoday SFB सुरक्षित है?" },
    { en: "₹1L investment maturity for 1 year?", hi: "1 साल के लिए ₹1 लाख पर कितना मिलेगा?" },
    { en: "What is DICGC insurance?", hi: "DICGC बीमा क्या है?" }
  ];

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-accent-blue text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group overflow-hidden"
      >
        <MessageSquare className="group-hover:rotate-12 transition-transform" />
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: window.innerWidth < 768 ? 0 : '100%', y: window.innerWidth < 768 ? '100%' : 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: window.innerWidth < 768 ? 0 : '100%', y: window.innerWidth < 768 ? '100%' : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="fixed top-0 right-0 w-full md:w-[450px] h-full bg-[#0d1a2e] border-l border-white/10 shadow-2xl z-50 flex flex-col md:top-0 md:bottom-auto bottom-0 md:h-full h-[75vh] md:rounded-none rounded-t-[2rem]"
          >
            {/* Header */}
            <div className="p-6 bg-[#112240] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                   <Bot size={24} />
                </div>
                 <div>
                   <h3 className="font-syne font-bold text-lg text-white">WealthSense AI</h3>
                   <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isTyping ? 'text-accent-gold' : 'text-accent-green'}`}>
                     <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-accent-gold animate-pulse' : 'bg-accent-green'}`} />
                     {isTyping ? t.statusThinking : t.statusOnline}
                   </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-hide">
              {chatMessages.length === 0 && (
                 <div className="space-y-8 mt-4">
                   <div className="bg-[#112240] p-6 rounded-2xl border border-white/5 shadow-xl">
                      <p className="text-sm text-text-muted leading-relaxed">
                        {t.welcome}
                      </p>
                   </div>
                   <div className="space-y-3">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 opacity-50">{t.suggestedTitle}</span>
                     <div className="grid gap-2">
                        {suggestedPrompts.map((p, idx) => (
                           <button
                             key={idx}
                             onClick={() => handleSend(language === 'en' ? p.en : p.hi)}
                             className="text-left text-[13px] p-4 rounded-xl bg-[#112240] border border-white/5 hover:border-accent-blue hover:translate-x-1 transition-all group flex justify-between items-center"
                           >
                              <span>{language === 'en' ? p.en : p.hi}</span>
                              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-blue" />
                           </button>
                        ))}
                     </div>
                   </div>
                 </div>
              )}

              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl ${
                     m.role === 'user' 
                      ? 'bg-accent-blue text-white rounded-tr-none shadow-lg' 
                      : 'bg-[#112240] border border-white/5 text-white/90 rounded-tl-none shadow-md'
                   }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                   </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-[#112240]/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-text-muted font-bold uppercase tracking-tighter">{t.statusThinking}</span>
                   </div>
                </div>
              )}
              {isLocked && (
                <div className="bg-bg-tertiary p-6 rounded-2xl border border-accent-gold/30 text-center space-y-4">
                  <p className="text-sm font-bold text-accent-gold">
                    {language === 'hi' ? 'आपने 3 मुफ़्त मैसेज इस्तेमाल कर लिए हैं।' : 'You have used your 3 free messages.'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === 'hi' ? 'आगे बात करने के लिए साइन इन करें।' : 'Please sign in to continue chatting with our AI advisor.'}
                  </p>
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="w-full py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-blue/90"
                  >
                    {language === 'hi' ? 'साइन इन करें' : 'Sign In Now'}
                  </button>
                </div>
              )}
            </div>

            {/* Input Overlay */}
            <div className="p-6 border-t border-white/5 bg-[#112240]">
              <div className="relative">
                 <input 
                   type="text"
                   maxLength={500}
                   placeholder={t.placeholder}
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   className="w-full bg-[#0d1a2e] border border-white/10 rounded-2xl py-4.5 pl-6 pr-14 text-sm outline-none focus:border-accent-blue transition-all placeholder:opacity-50"
                 />
                 <button 
                   onClick={() => handleSend()}
                   disabled={isTyping || !input.trim()}
                   className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F59E0B] text-black rounded-xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30 active:scale-95"
                 >
                    <Send size={18} />
                 </button>
              </div>
              <p className="text-[10px] text-center mt-4 text-text-muted uppercase tracking-widest font-extrabold opacity-60">
                {t.powerBy}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

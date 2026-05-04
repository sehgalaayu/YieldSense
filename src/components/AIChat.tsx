import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUserStore } from "../store/userStore";
import { useAuthStore } from "../store/authStore";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { translations } from "../lib/translations";

const suggestedPrompts = [
  {
    en: "Which bank is safest for 1 year FD?",
    hi: "1 साल की FD के लिए कौन सा बैंक सबसे सुरक्षित है?",
  },
  {
    en: "Explain DICGC insurance in simple terms.",
    hi: "DICGC बीमा को सरल शब्दों में समझाएं।",
  },
  {
    en: "What is my post-tax yield on 8% gross?",
    hi: "8% ग्रॉस पर मेरा टैक्स-पश्चात यील्ड क्या है?",
  },
];

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const {
    chatMessages,
    addChatMessage,
    language,
    principal,
    tenorMonths,
    taxSlab,
    recommendedFDs,
    mfHoldings,
    mfAnalysisResults,
  } = useUserStore();
  const { user, setAuthModalOpen } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[language].chat;

  const userMessageCount = chatMessages.filter((m) => m.role === "user").length;
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
        setTimeout(() => {
          handleSend(prompt);
        }, 300);
      }
    };

    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    const state = useUserStore.getState();
    const currentMessages = state.chatMessages;

    // Check lock
    const userMessageCount = currentMessages.filter(
      (m) => m.role === "user",
    ).length;
    if (!user && userMessageCount >= 3) {
      setAuthModalOpen(true);
      return;
    }

    const newMessage = { role: "user" as const, content: textToSend };
    addChatMessage(newMessage);
    setInput("");
    setIsTyping(true);

    console.log("Sending message to AI:", textToSend);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/wealthsense-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...currentMessages, newMessage],
          userContext: {
            principal: state.principal,
            tenorMonths: state.tenorMonths,
            taxSlab: state.taxSlab,
            recommendedFDs: state.recommendedFDs,
            mfHoldings: state.mfHoldings,
            mfAnalysisResults: state.mfAnalysisResults,
          },
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chat failed");
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      console.log("Received AI response:", data);

      if (!data.content) {
        throw new Error("AI returned an empty response");
      }

      addChatMessage({ role: "assistant", content: data.content });
    } catch (err: any) {
      console.error("Chat error details:", err);
      let errorMsg = err.message;
      if (err.name === "AbortError") {
        errorMsg = "Request timed out. The AI is taking too long to respond.";
      } else if (err.message === "Failed to fetch") {
        errorMsg =
          "Network Error: The request was blocked. Please disable any translation or ad-block extensions and try again.";
      }

      addChatMessage({
        role: "assistant",
        content:
          language === "hi" ? `त्रुटि: ${errorMsg}` : `Error: ${errorMsg}`,
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-40 shadow-lg transition-all hover:scale-110 active:scale-95 w-14 h-14 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xl border-2 border-[#3B82F6]/30 bottom-20 right-4 md:bottom-6 md:right-6"
      >
        💬
        <span className="absolute inset-0 rounded-full bg-[#1A56DB] animate-ping opacity-20 pointer-events-none" />
      </button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "transform" }}
            className="fixed z-50 bottom-0 left-0 right-0 md:left-auto h-[85vh] md:h-full rounded-t-2xl md:rounded-none border-t md:border-t-0 border-[#1E3A5F] bg-[#0d1a2e] md:top-0 md:right-0 md:w-[450px] md:border-l shadow-2xl flex flex-col transform-gpu"
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-[#1E3A5F]" />
            </div>
            {/* Header */}
            <div className="p-4 md:p-6 bg-[#112240] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-white">
                    WealthSense AI
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isTyping ? "text-accent-gold" : "text-accent-green"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isTyping ? "bg-accent-gold animate-pulse" : "bg-accent-green"}`}
                    />
                    {isTyping ? t.statusThinking : t.statusOnline}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-hide"
            >
              {chatMessages.length === 0 && (
                <div className="space-y-8 mt-4">
                  <div className="bg-[#112240] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <p className="text-sm text-text-muted leading-relaxed">
                      {t.welcome}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 opacity-50">
                      {t.suggestedTitle}
                    </span>
                    <div className="grid gap-2">
                      {suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            handleSend(language === "en" ? p.en : p.hi)
                          }
                          className="text-left text-[13px] p-4 rounded-xl bg-[#112240] border border-white/5 hover:border-accent-blue hover:translate-x-1 transition-all group flex justify-between items-center"
                        >
                          <span>{language === "en" ? p.en : p.hi}</span>
                          <ArrowRight
                            size={14}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-blue"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      m.role === "user"
                        ? "bg-accent-blue text-white rounded-tr-none shadow-lg"
                        : "bg-[#112240] border border-white/5 text-white/90 rounded-tl-none shadow-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#112240]/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-[11px] text-text-muted font-bold uppercase tracking-tighter">
                      {t.statusThinking}
                    </span>
                  </div>
                </div>
              )}

              {isLocked && (
                <div className="bg-bg-tertiary p-6 rounded-2xl border border-accent-gold/30 text-center space-y-4">
                  <p className="text-sm font-bold text-accent-gold">
                    {language === "hi"
                      ? "आपने 3 मुफ़्त मैसेज इस्तेमाल कर लिए हैं।"
                      : "You have used your 3 free messages."}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "hi"
                      ? "आगे बात करने के लिए साइन इन करें।"
                      : "Please sign in to continue chatting with our AI advisor."}
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-blue/90"
                  >
                    {language === "hi" ? "साइन इन करें" : "Sign In Now"}
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-[#112240]">
              <div className="relative">
                <input
                  type="text"
                  maxLength={500}
                  placeholder={t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
    </>
  );
}

const ArrowRight = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
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

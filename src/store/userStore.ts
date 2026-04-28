import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, FDProduct, BookedFD, ChatMessage, MFHolding, MFAnalysisResult } from '../lib/types';

interface UserStore {
  // Profile
  principal: number;
  tenorMonths: number;
  taxSlab: 0 | 5 | 20 | 30;
  goal: 'MaxYield' | 'Safety' | 'Balanced';
  riskTolerance: 'Low' | 'Medium' | 'High';
  liquidityNeed: 'Low' | 'Medium' | 'High';
  
  // Language
  language: 'hi' | 'en';
  setLanguage: (lang: 'hi' | 'en') => void;
  
  // Recommendations
  recommendedFDs: FDProduct[];
  setRecommendedFDs: (fds: FDProduct[]) => void;
  
  // Portfolio
  bookedFDs: BookedFD[];
  bookFD: (fd: FDProduct, amount: number) => void;
  
  // Chat
  chatMessages: ChatMessage[],
  addChatMessage: (message: ChatMessage) => void,
  updateLastMessage: (content: string) => void,
  clearChat: () => void,
  
  // MF Portfolio
  mfHoldings: MFHolding[];
  mfAnalysisResults: MFAnalysisResult[];
  addMFHolding: (holding: MFHolding) => void;
  removeMFHolding: (fundId: string) => void;
  setMFAnalysisResults: (results: MFAnalysisResult[]) => void;
  clearMFAnalysis: () => void;
  
  // Cache
  navCache: Record<string, number>;
  setNavCache: (schemeCode: string, nav: number) => void;
  
  // Profile setters
  setProfile: (profile: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      principal: 100000,
      tenorMonths: 12,
      taxSlab: 20,
      goal: 'Balanced',
      riskTolerance: 'Medium',
      liquidityNeed: 'Medium',
      
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      
      recommendedFDs: [],
      setRecommendedFDs: (fds) => set({ recommendedFDs: fds }),
      
      bookedFDs: [],
      bookFD: (fd, amount) => set((state) => ({
        bookedFDs: [...state.bookedFDs, {
          fdId: fd.id,
          bankName: fd.bankName,
          amount,
          tenor: fd.tenor,
          grossRate: fd.grossRate,
          date: new Date().toISOString(),
        }]
      })),

      chatMessages: [],
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      updateLastMessage: (content) => set((state) => {
        const newMessages = [...state.chatMessages];
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = { 
            ...newMessages[newMessages.length - 1], 
            content: newMessages[newMessages.length - 1].content + content 
          };
        }
        return { chatMessages: newMessages };
      }),
      clearChat: () => set({ chatMessages: [] }),
      
      mfHoldings: [],
      mfAnalysisResults: [],
      addMFHolding: (holding) => set((state) => ({ mfHoldings: [...state.mfHoldings, holding] })),
      removeMFHolding: (fundId) => set((state) => ({ mfHoldings: state.mfHoldings.filter((h) => h.fundId !== fundId) })),
      setMFAnalysisResults: (results) => set({ mfAnalysisResults: results }),
      clearMFAnalysis: () => set({ mfAnalysisResults: [], mfHoldings: [] }),
      
      navCache: {},
      setNavCache: (schemeCode, nav) => set((state) => ({ navCache: { ...state.navCache, [schemeCode]: nav } })),
      
      setProfile: (profile) => set((state) => ({ ...state, ...profile })),
    }),
    {
      name: 'wealthsense-storage',
      partialize: (state) => ({
        principal: state.principal,
        tenorMonths: state.tenorMonths,
        taxSlab: state.taxSlab,
        goal: state.goal,
        riskTolerance: state.riskTolerance,
        language: state.language,
        bookedFDs: state.bookedFDs,
        mfHoldings: state.mfHoldings,
        mfAnalysisResults: state.mfAnalysisResults,
      }),
    }
  )
);

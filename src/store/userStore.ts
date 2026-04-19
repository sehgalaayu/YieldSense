import { create } from 'zustand';
import { UserProfile, FDProduct, BookedFD, ChatMessage } from '../lib/types';

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
  
  // Profile setters
  setProfile: (profile: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
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
  
  setProfile: (profile) => set((state) => ({ ...state, ...profile })),
}));

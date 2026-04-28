import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, signIn, signUp } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    let err = null;
    if (isSignUp) {
      const res = await signUp(email, password);
      err = res.error;
    } else {
      const res = await signIn(email, password);
      err = res.error;
    }
    
    setLoading(false);
    
    if (err) {
      setErrorMsg(err);
    } else {
      setAuthModalOpen(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#112240] border border-[#1E3A5F] rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          <button 
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-6 right-6 text-[#94A3B8] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <div className="flex bg-[#0A0F1E] rounded-xl p-1 mb-6 border border-[#1E3A5F]">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-[#64748B] hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-[#64748B] hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin
                }
              });
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 
              border border-[#1E3A5F] rounded-lg text-[#F1F5F9] text-sm 
              font-medium hover:border-[#3B82F6] hover:bg-[#0D1A2E] 
              transition-all mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#1E3A5F]"/>
            <span className="text-xs text-[#64748B]">or</span>
            <div className="flex-1 h-px bg-[#1E3A5F]"/>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white placeholder-[#64748B] focus:border-[#F59E0B] focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#64748B] mb-2">Password</label>
              <input 
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white placeholder-[#64748B] focus:border-[#F59E0B] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            {errorMsg && (
              <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-bold text-lg rounded-xl shadow-lg hover:shadow-[#F59E0B]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

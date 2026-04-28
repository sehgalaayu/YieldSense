import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuthStore();

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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#112240] border border-[#1E3A5F] rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          <button 
            onClick={onClose}
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

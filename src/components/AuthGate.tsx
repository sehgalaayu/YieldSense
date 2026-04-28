import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import AuthModal from './AuthModal';
import { Lock } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

export default function AuthGate({ children, fallback, message }: AuthGateProps) {
  const { user } = useUserStore();
  const [showAuth, setShowAuth] = useState(false);

  if (user) return <>{children}</>;

  if (fallback) return <div onClick={() => setShowAuth(true)}>{fallback}</div>;

  return (
    <>
      <div 
        onClick={() => setShowAuth(true)}
        className="relative group cursor-pointer"
      >
        <div className="filter blur-[4px] pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-xl transition-all group-hover:bg-black/30">
          <div className="bg-bg-tertiary p-3 rounded-full border border-accent-gold/50 shadow-lg mb-3">
            <Lock className="text-accent-gold" size={24} />
          </div>
          <p className="text-white font-bold text-sm text-center px-4">
            {message || 'Sign in to unlock this feature'}
          </p>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}

export function LockedButton({ children, onClick, ...props }: any) {
  const { user } = useUserStore();
  const [showAuth, setShowAuth] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      setShowAuth(true);
    } else {
      onClick?.(e);
    }
  };

  return (
    <>
      <button {...props} onClick={handleClick}>
        {!user && <Lock size={14} className="inline mr-2" />}
        {children}
      </button>
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}

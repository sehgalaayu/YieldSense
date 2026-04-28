'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { Button, buttonVariants } from './ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from './ui/menu-toggle-icon';
import { useScroll } from './ui/use-scroll';
import { translations } from '../lib/translations';
import AuthModal from './AuthModal';


export default function Navbar() {
  const { language, setLanguage } = useUserStore();
  const { user, signOut } = useAuthStore();
  const [open, setOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const t = translations[language].nav;

  const links = [
    { label: t.compare, href: '/compare' },
    { label: t.mf, href: '/mf' },
    { label: 'FD vs MF', href: '/compare-fd-mf' },
    { label: t.calculator, href: '/calculator' },
    { label: t.portfolio, href: '/portfolio' },
  ];

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-transparent md:transition-all md:ease-out',
        {
          'bg-bg-primary/95 supports-[backdrop-filter]:bg-bg-primary/50 border-white/5 backdrop-blur-lg md:top-4 md:max-w-5xl md:rounded-2xl md:border md:shadow-2xl md:shadow-accent-blue/5':
            scrolled && !open,
          'bg-bg-primary': open,
        },
      )}
    >
      <nav
        className={cn(
          'flex h-20 w-full items-center justify-between px-6 md:h-16 md:transition-all md:ease-out',
          {
            'md:px-4': scrolled,
          },
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src="/yield-sense-logo.png" 
            alt="WealthSense Logo" 
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
          />
          <span className="font-syne text-lg font-bold tracking-tight text-white group-hover:text-accent-blue transition-colors">WealthSense</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link, i) => (
            <Link 
              key={i} 
              className={buttonVariants({ variant: 'ghost', className: 'text-sm font-bold hover:text-accent-gold transition-colors' })} 
              to={link.href}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 ml-2">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-full transition-all ${language === 'en' ? 'bg-[#1A56DB] text-white shadow-lg shadow-accent-blue/20' : 'text-[#64748B] hover:text-white'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-full transition-all ${language === 'hi' ? 'bg-[#1A56DB] text-white shadow-lg shadow-accent-blue/20' : 'text-[#64748B] hover:text-white'}`}
            >
              HI
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#94A3B8]">{user.email}</span>
              <Button onClick={() => signOut()} variant="ghost" className="text-[#94A3B8] hover:text-white">
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setAuthModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-extrabold px-6 rounded-xl shadow-lg shadow-[#F59E0B]/10"
            >
              {t.getStarted}
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="md:hidden text-white hover:bg-white/5">
          <MenuToggleIcon open={open} className="size-6" duration={300} />
        </Button>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={cn(
          'bg-bg-primary fixed top-20 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-t border-white/5 md:hidden transition-all duration-300',
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
        )}
      >
        <div
          className={cn(
            'flex h-full w-full flex-col justify-between gap-y-2 p-8',
          )}
        >
          <div className="grid gap-y-4">
            {links.map((link) => (
              <Link
                key={link.label}
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  variant: 'ghost',
                  className: 'justify-start text-2xl font-bold py-8 h-auto border-b border-white/5 rounded-none hover:bg-transparent hover:text-accent-gold',
                })}
                to={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="flex flex-col gap-6 pt-8 border-t border-white/5">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setLanguage('en')} 
                className={`flex-1 py-4 text-xs font-bold rounded-xl transition-all ${language === 'en' ? 'bg-accent-blue text-white shadow-xl' : 'text-text-muted'}`}
              >
                ENGLISH
              </button>
              <button 
                onClick={() => setLanguage('hi')} 
                className={`flex-1 py-4 text-xs font-bold rounded-xl transition-all ${language === 'hi' ? 'bg-accent-blue text-white shadow-xl' : 'text-text-muted'}`}
              >
                हिंदी
              </button>
            </div>
            
            <Link to="/onboarding" onClick={() => setOpen(false)}>
              <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-extrabold py-8 rounded-2xl text-xl shadow-2xl shadow-[#F59E0B]/20">
                {t.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}

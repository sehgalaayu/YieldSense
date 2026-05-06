"use client";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useAuthStore } from "../store/authStore";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "./ui/menu-toggle-icon";
import { useScroll } from "./ui/use-scroll";
import { translations } from "../lib/translations";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { language, setLanguage } = useUserStore();
  const bookedFDs = useUserStore((state) => state.bookedFDs);
  const hasActiveBookings = bookedFDs && bookedFDs.length > 0;
  const { user, signOut, setAuthModalOpen } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const scrolled = useScroll(10);
  const t = translations[language].nav;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserInitials = (email: string) => {
    const name = (email || "").split("@")[0] || "U";
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      "#1A56DB",
      "#7C3AED",
      "#059669",
      "#DC2626",
      "#D97706",
      "#0891B2",
    ];
    if (!email) return colors[0];
    return colors[email.charCodeAt(0) % colors.length];
  };

  const links = [
    { label: t.compare, href: "/compare" },
    { label: t.mf, href: "/mf" },
    { label: "FD vs MF", href: "/compare-fd-mf" },
    { label: t.calculator, href: "/calculator" },
    { label: language === "hi" ? "लक्ष्य" : "Goals", href: "/goals" },
    { label: t.watchlist, href: "/portfolio#watchlist" },
    { label: t.portfolio, href: "/portfolio" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-transparent md:transition-all md:ease-out overflow-visible",
        {
          "bg-bg-primary/95 supports-[backdrop-filter]:bg-bg-primary/50 border-white/5 backdrop-blur-lg md:top-4 md:rounded-2xl md:border md:shadow-2xl md:shadow-accent-blue/5":
            scrolled && !mobileMenuOpen,
          "bg-bg-primary": mobileMenuOpen,
        },
      )}
    >
      <nav
        className={cn(
          "mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:h-16 md:transition-all md:ease-out overflow-visible",
        )}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 group mr-4 lg:mr-8 flex-shrink-0"
        >
          <img
            src="/yield-sense-logo.png"
            alt="WealthSense Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-heading text-lg lg:text-xl font-bold tracking-tight text-white group-hover:text-accent-blue transition-colors whitespace-nowrap">
            WealthSense
          </span>
        </Link>

        {/* Desktop Nav */}
        <div
          className={cn(
            "hidden items-center md:flex flex-1 min-w-0 justify-between overflow-visible",
            scrolled ? "gap-2 lg:gap-4" : "gap-4 lg:gap-6",
          )}
        >
          <div className="flex min-w-0 items-center gap-1 lg:gap-2 overflow-hidden">
            {links.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className={buttonVariants({
                  variant: "ghost",
                  className: cn(
                    "text-sm font-bold hover:text-accent-gold transition-colors px-2 lg:px-4 inline-flex items-center gap-1.5",
                    scrolled && "px-1.5 lg:px-3",
                  ),
                })}
              >
                {link.label}
                {link.href === "/portfolio" && hasActiveBookings && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0 inline-block" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded-full transition-all ${language === "en" ? "bg-[#1A56DB] text-white shadow-lg shadow-accent-blue/20" : "text-[#64748B] hover:text-white"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded-full transition-all ${language === "hi" ? "bg-[#1A56DB] text-white shadow-lg shadow-accent-blue/20" : "text-[#64748B] hover:text-white"}`}
              >
                HI
              </button>
            </div>

            {user ? (
              <div
                className="relative hidden md:block shrink-0 z-[100]"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[#1E3A5F] hover:border-[#3B82F6] transition-all group bg-[#0D1A2E] max-w-full"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: getAvatarColor(user.email || ""),
                    }}
                  >
                    {getUserInitials(user.email || "U")}
                  </div>
                  <span className="text-[#94A3B8] text-xs font-medium group-hover:text-[#F1F5F9] transition-colors max-w-[120px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`text-[#64748B] transition-transform flex-shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 z-[101] bg-[#0D1A2E] border border-[#1E3A5F] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-[#1E3A5F] bg-[#112240]/50">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{
                            backgroundColor: getAvatarColor(user.email || ""),
                          }}
                        >
                          {getUserInitials(user.email || "U")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#F1F5F9] text-sm font-medium truncate">
                            {user.email?.split("@")[0]}
                          </p>
                          <p className="text-[#64748B] text-xs truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5">
                      {[
                        {
                          icon: "💼",
                          label: "My Portfolio",
                          path: "/portfolio",
                        },
                        { icon: "🎯", label: "My Goals", path: "/goals" },
                        {
                          icon: "📊",
                          label: "MF Analysis",
                          path: "/mf/results",
                        },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#112240] transition-all text-sm"
                        >
                          <span className="text-base w-5 text-center">
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-[#1E3A5F] my-1" />

                    <div className="py-1.5 px-2">
                      <button
                        onClick={() => {
                          signOut();
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-all text-sm"
                      >
                        <span className="text-base w-5 text-center">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className={cn(
                  "bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-extrabold rounded-xl shadow-lg shadow-[#F59E0B]/10 transition-all ml-2 shrink-0",
                  scrolled ? "px-4 py-1.5 text-xs" : "px-6",
                )}
              >
                {t.getStarted}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden text-white hover:bg-white/5"
          aria-label="Open menu"
        >
          <MenuToggleIcon
            open={mobileMenuOpen}
            className="size-6"
            duration={300}
          />
        </Button>
      </nav>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className={`fixed top-0 right-0 h-full w-72 z-50 bg-[#0D1A2E] border-l border-[#1E3A5F] md:hidden flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <span className="text-[#1A56DB] font-heading font-black text-lg">
                  WealthSense
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg border border-[#1E3A5F] flex items-center justify-center text-[#64748B] hover:border-[#3B82F6] hover:text-[#F1F5F9] transition-all"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {user && (
              <div className="px-5 py-4 border-b border-[#1E3A5F] bg-[#112240]/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-sm font-bold">
                    {getUserInitials(user.email || "U")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#F1F5F9] text-sm font-medium truncate">
                      {user.email}
                    </p>
                    <p className="text-[#64748B] text-xs">Signed in</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto py-4">
              {[
                {
                  icon: "🏦",
                  label: "Fixed Deposits",
                  path: "/compare",
                  desc: "Compare FD rates",
                },
                {
                  icon: "📈",
                  label: "Mutual Funds",
                  path: "/mf",
                  desc: "MF switching advisor",
                },
                {
                  icon: "⚖️",
                  label: "FD vs MF",
                  path: "/compare-fd-mf",
                  desc: "Compare instruments",
                },
                {
                  icon: "🧮",
                  label: "Calculator",
                  path: "/calculator",
                  desc: "Post-tax yield calc",
                },
                {
                  icon: "🎯",
                  label: "Goals",
                  path: "/goals",
                  desc: "Financial goal planner",
                },
                {
                  icon: "💼",
                  label: "Portfolio",
                  path: "/portfolio",
                  desc: "Your investments",
                },
              ].map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 transition-all border-l-2 mx-2 rounded-r-lg mb-1 ${isActive ? "border-[#F59E0B] bg-[#F59E0B]/5 text-[#F1F5F9]" : "border-transparent hover:border-[#1E3A5F] hover:bg-[#112240] text-[#94A3B8]"}`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-medium text-sm inline-flex items-center gap-1.5 ${isActive ? "text-[#F1F5F9]" : ""}`}
                      >
                        {item.label}
                        {item.path === "/portfolio" && hasActiveBookings && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0 inline-block" />
                        )}
                      </p>
                      <p className="text-[#64748B] text-xs">{item.desc}</p>
                    </div>
                    {isActive && (
                      <span className="ml-auto text-[#F59E0B] text-xs">→</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#1E3A5F] space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#112240] border border-[#1E3A5F]">
                <span className="text-[#64748B] text-xs flex-1">Language</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${language === "en" ? "bg-[#1A56DB] text-white" : "text-[#64748B]"}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage("hi")}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${language === "hi" ? "bg-[#1A56DB] text-white" : "text-[#64748B]"}`}
                  >
                    HI
                  </button>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-red-800/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-950/20 transition-all"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#F59E0B] text-black font-bold rounded-lg text-sm"
                >
                  Sign In / Sign Up →
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

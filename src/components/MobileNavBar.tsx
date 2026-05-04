import { useLocation, useNavigate } from "react-router-dom";

export const MobileNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { icon: "🏦", label: "FDs", path: "/compare" },
    { icon: "📈", label: "MFs", path: "/mf" },
    { icon: "🧮", label: "Calc", path: "/calculator" },
    { icon: "🎯", label: "Goals", path: "/goals" },
    { icon: "💼", label: "Portfolio", path: "/portfolio" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-[#0A0F1E]/95 backdrop-blur-xl border-t border-[#1E3A5F]">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path !== "/" && location.pathname.startsWith(tab.path));

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 flex-1 ${isActive ? "bg-[#F59E0B]/10" : "active:bg-[#112240]"}`}
              >
                <span
                  className={`text-base leading-none transition-all ${isActive ? "scale-110" : ""}`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[9px] font-medium mt-0.5 leading-none transition-colors ${isActive ? "text-[#F59E0B]" : "text-[#64748B]"}`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#F59E0B] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

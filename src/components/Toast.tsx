import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  open: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  position?: "top-right" | "bottom-center";
  actionLabel?: string;
  onAction?: () => void;
}

export default function Toast({
  open,
  message,
  type = "info",
  duration = 3000,
  onClose,
  position = "top-right",
  actionLabel,
  onAction,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  const icon = () => {
    if (type === "success")
      return <CheckCircle2 className="text-green-400" size={18} />;
    if (type === "error")
      return <AlertCircle className="text-red-400" size={18} />;
    return <X className="text-slate-400" size={18} />;
  };

  const node = (
    <AnimatePresence>
      {open &&
        (position === "bottom-center" ? (
          <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pointer-events-auto w-fit max-w-[calc(100vw-2rem)]"
            >
              <div className="flex items-center gap-3 bg-[#0B1220] border border-[#23364A] rounded-xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                <div className="w-8 h-8 flex items-center justify-center">
                  {icon()}
                </div>
                <div className="text-sm text-[#E6EEF8] font-medium whitespace-normal break-words">
                  {message}
                </div>
                {actionLabel && onAction && (
                  <button
                    onClick={onAction}
                    className="ml-2 shrink-0 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#20bd5a]"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-6 right-6 z-50"
          >
            <div className="flex items-center gap-3 bg-[#0B1220] border border-[#23364A] rounded-xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="w-8 h-8 flex items-center justify-center">
                {icon()}
              </div>
              <div className="text-sm text-[#E6EEF8] font-medium">
                {message}
              </div>
              {actionLabel && onAction && (
                <button
                  onClick={onAction}
                  className="ml-2 shrink-0 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#20bd5a]"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          </motion.div>
        ))}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}

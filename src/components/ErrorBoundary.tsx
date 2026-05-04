import React, { Component, ReactNode, useEffect, useState } from "react";
import Toast from "./Toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

function ShowErrorToast({ message }: { message: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Toast
      open={open}
      message={message}
      type="error"
      onClose={() => setOpen(false)}
      duration={5000}
      position="top-right"
    />
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || "An unexpected error occurred";
      return (
        this.props.fallback || (
          <>
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <p className="text-4xl mb-4">⚠️</p>
                <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">
                  Something went wrong
                </h2>
                <p className="text-[#64748B] mb-6 text-sm">{msg}</p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-4 py-2 bg-[#F59E0B] text-black font-bold rounded-lg"
                >
                  Go Home
                </button>
              </div>
            </div>
            <ShowErrorToast message={msg} />
          </>
        )
      );
    }
    return this.props.children;
  }
}

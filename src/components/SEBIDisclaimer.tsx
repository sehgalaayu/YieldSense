import React from "react";

export const SEBIBanner = () => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 mb-4 mt-8">
    <span className="text-amber-400 text-sm flex-shrink-0">⚠️</span>
    <p className="text-xs text-amber-200/70 leading-relaxed">
      <strong className="text-amber-300">Investment Disclaimer:</strong>{" "}
      WealthSense is not a SEBI-registered investment advisor. All information
      is for educational purposes only and does not constitute financial advice.
      Please consult a SEBI-registered advisor before making investment
      decisions. Mutual fund investments are subject to market risks.
    </p>
  </div>
);

export const SEBIFooterNote = () => (
  <p className="text-[10px] text-[#64748B] text-center mt-2 pb-4">
    Not SEBI registered · For educational purposes only · Mutual fund
    investments subject to market risks · Past performance not indicative of
    future results
  </p>
);

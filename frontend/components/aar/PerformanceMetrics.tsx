import React from "react";
import { Radio, WifiOff, Clock, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";

interface PerformanceMetricsProps {
  stats: {
    duration: string;
    messagesTotal: number;
    messagesDelivered: number;
    messagesDelayed: number;
    messagesDropped: number;
    decisionsCount: number;
    finalCommsStatus: string;
    finalMapStatus: string;
  };
  className?: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ stats, className = "" }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs ${className}`}>
      {/* Messages Sent */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="text-[10px] text-slate-500 font-bold uppercase">TOTAL TRANSMISSIONS</div>
        <div className="text-xl font-black text-slate-100 mt-1">{stats.messagesTotal}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Attempted radio packets</div>
      </div>

      {/* Delivered */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="text-[10px] text-emerald-500 font-bold uppercase">DELIVERED PACKETS</div>
        <div className="text-xl font-black text-emerald-400 mt-1">{stats.messagesDelivered}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Reached receivers intact</div>
      </div>

      {/* Delayed */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="text-[10px] text-amber-500 font-bold uppercase">DELAYED TRANSMISSIONS</div>
        <div className="text-xl font-black text-amber-400 mt-1">{stats.messagesDelayed}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Queued due to latency</div>
      </div>

      {/* Dropped / Severed */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="text-[10px] text-rose-500 font-bold uppercase">DROPPED (JAMMED)</div>
        <div className="text-xl font-black text-rose-400 mt-1">{stats.messagesDropped}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Carrier lost / unacknowledged</div>
      </div>
    </div>
  );
};

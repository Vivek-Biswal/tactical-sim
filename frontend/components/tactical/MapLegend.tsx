import React, { useState } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 rounded px-3 py-2 text-xs shadow-lg max-w-xs transition-all">
      <div
        className="flex items-center justify-between cursor-pointer font-semibold text-slate-400 uppercase tracking-wider pb-1"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tactical Map Legend</span>
        </div>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>

      {!collapsed && (
        <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80 font-mono text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-cyan-400 bg-cyan-950/60 inline-block rounded-xs" />
            <span className="text-slate-300">Friendly Element (Alpha / Bravo)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-amber-400 bg-amber-950/60 rotate-45 inline-block rounded-xs" />
            <span className="text-slate-300">Target Objective / Waypoint</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-yellow-500 bg-yellow-950/80 text-center font-bold text-[9px] text-yellow-300 inline-block rounded-xs">
              ?
            </span>
            <span className="text-slate-300">Unverified / Contradictory Contact</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-red-500 bg-red-950/80 text-center font-bold text-[8px] text-red-300 inline-block rounded-xs">
              EW
            </span>
            <span className="text-slate-300">Suspected Mobile Jammer (EW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-0.5 bg-slate-600 inline-block border-b border-dashed border-slate-400" />
            <span className="text-slate-400">Primary Highway Corridor</span>
          </div>
        </div>
      )}
    </div>
  );
};

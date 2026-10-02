import React, { useState } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md border border-[#D9D8CE] text-[#344438] rounded px-3 py-2 text-xs shadow-lg max-w-xs transition-all">
      <button
        aria-expanded={!collapsed}
        className="flex items-center justify-between cursor-pointer font-semibold text-[#687066] uppercase tracking-wider pb-1"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#556B3F]" />
          <span>Tactical Map Legend</span>
        </div>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {!collapsed && (
        <div className="space-y-1.5 pt-1.5 border-t border-[#D9D8CE]/80 font-mono text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-[#556B3F] bg-[#EEF3E8]/60 inline-block rounded-xs" />
            <span className="text-[#344438]">Friendly Element (Alpha / Bravo)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-amber-400 bg-[#FDF3E3] rotate-45 inline-block rounded-xs" />
            <span className="text-[#344438]">Target Objective / Waypoint</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-yellow-500 bg-[#FDF3E3] text-center font-bold text-[9px] text-[#8A5C2A] inline-block rounded-xs">
              ?
            </span>
            <span className="text-[#344438]">Unverified / Contradictory Contact</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-red-500 bg-[#FAF0EF] text-center font-bold text-[8px] text-[#A94A3F] inline-block rounded-xs">
              EW
            </span>
            <span className="text-[#344438]">Suspected Mobile Jammer (EW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-0.5 bg-slate-600 inline-block border-b border-dashed border-slate-400" />
            <span className="text-[#687066]">Primary Highway Corridor</span>
          </div>
        </div>
      )}
    </div>
  );
};

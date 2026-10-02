"use client";

import React from "react";
import { Map as MapIcon, CircleDot, Eye } from "lucide-react";

export function TeamMapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[#EDE5D0] rounded-xl border border-[#D9D8CE] overflow-hidden flex flex-col min-h-[280px]">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/85 backdrop-blur border-b border-[#D9D8CE] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={12} className="text-[#344438]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#344438]">Team Position</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono font-bold tracking-widest uppercase">
          <span className="text-[#687066]">Grid: 24A</span>
          <span className="text-[#B87A3A] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B87A3A] animate-pulse" />
            Map: Delayed
          </span>
        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 relative overflow-hidden bg-[#F5F0E8] mt-8">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Topographic lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          preserveAspectRatio="none"
        >
          <path d="M0,60 Q100,30 200,80 T400,60" fill="none" stroke="#556B3F" strokeWidth="2" />
          <path d="M0,80 Q100,50 200,100 T400,80" fill="none" stroke="#556B3F" strokeWidth="2" />
          <path d="M0,100 Q100,70 200,120 T400,100" fill="none" stroke="#556B3F" strokeWidth="2" />
          {/* Assigned sector boundary */}
          <rect
            x="30%" y="20%" width="42%" height="55%"
            fill="#556B3F" fillOpacity="0.06"
            stroke="#556B3F" strokeWidth="1.5" strokeDasharray="6 4"
          />
        </svg>

        {/* Grid Labels */}
        <div className="absolute top-2 left-2 text-[7px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 24A</div>
        <div className="absolute top-2 right-2 text-[7px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 25B</div>
        <div className="absolute bottom-2 left-2 text-[7px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 26C</div>

        {/* Assigned area label */}
        <div className="absolute top-[24%] left-[32%] text-[7px] font-black tracking-widest text-[#556B3F] opacity-60 uppercase">
          Assigned Area
        </div>

        {/* BRAVO — team position (pulsing) */}
        <div className="absolute top-[45%] left-[50%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-10 h-10 rounded-full border-2 border-[#344438] animate-ping opacity-25" />
          <div className="text-[8px] font-black tracking-widest text-white bg-[#344438] px-1.5 py-0.5 rounded mb-1 whitespace-nowrap">
            BRAVO (YOU)
          </div>
          <div className="w-4 h-4 border-2 border-[#344438] bg-[#EEF3E8] rotate-45" />
        </div>

        {/* OBSERVATION POINT */}
        <div className="absolute top-[30%] left-[68%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
          <div className="text-[7px] font-black tracking-widest text-[#556B3F] bg-white/80 px-1 rounded mb-1 whitespace-nowrap">
            OBS POINT
          </div>
          <Eye size={16} className="text-[#556B3F]" />
        </div>

        {/* REPORT PING */}
        <div className="absolute top-[55%] left-[35%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-6 h-6 rounded-full border-2 border-[#B87A3A] animate-ping opacity-50" />
          <div className="text-[7px] font-black tracking-widest text-[#B87A3A] bg-white/90 px-1 rounded mb-1 whitespace-nowrap">
            REPORT 017
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#B87A3A]" />
        </div>

        {/* ALPHA element (distant) */}
        <div className="absolute top-[25%] left-[22%] flex flex-col items-center opacity-50">
          <div className="text-[7px] font-black tracking-widest text-[#687066] bg-white/70 px-1 rounded mb-1">ALPHA</div>
          <CircleDot size={12} className="text-[#687066]" />
        </div>
      </div>

      {/* Legend footer */}
      <div className="flex-shrink-0 bg-white/70 border-t border-[#D9D8CE] px-3 py-1.5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 border-[#344438] bg-[#EEF3E8] rotate-45 flex-shrink-0" />
          <span className="text-[7px] font-black tracking-widest text-[#687066]">TEAM POSITION</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-px bg-[#556B3F] border-dashed border-t border-[#556B3F] flex-shrink-0" style={{ borderStyle: "dashed" }} />
          <span className="text-[7px] font-black tracking-widest text-[#687066]">ASSIGNED AREA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#B87A3A] flex-shrink-0" />
          <span className="text-[7px] font-black tracking-widest text-[#687066]">REPORT</span>
        </div>
      </div>
    </div>
  );
}

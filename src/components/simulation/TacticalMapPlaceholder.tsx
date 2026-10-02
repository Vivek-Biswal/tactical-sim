"use client";

import React from "react";
import { Plus, Minus, RotateCcw, Map as MapIcon, Triangle, Hexagon, CircleDot } from "lucide-react";

export function TacticalMapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[#E5D8BD] rounded-xl border border-[#D9D8CE] overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur border-b border-[#D9D8CE] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-[#344438]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#344438]">Tactical Map</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono font-bold tracking-widest uppercase">
          <span className="text-[#687066]">Grid: 24A</span>
          <span className="hidden sm:inline text-[#687066]">Scale: 1:25,000</span>
          <span className="hidden sm:inline text-[#687066]">Updated: 16:30</span>
          <span className="text-[#B87A3A] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B87A3A] animate-pulse" />
            Status: Delayed
          </span>
        </div>
      </div>

      {/* Map Content - Fictional SVG Map */}
      <div className="flex-1 relative overflow-hidden bg-[#F7F5EE]">
        {/* Coordinate Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#556B3F 1px, transparent 1px), linear-gradient(90deg, #556B3F 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: "center center"
          }}
        />

        {/* Topographic Lines (Fictional) */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
          <path d="M0,100 Q150,50 300,150 T600,100 T900,200" fill="none" stroke="#556B3F" strokeWidth="2" />
          <path d="M0,120 Q150,70 300,170 T600,120 T900,220" fill="none" stroke="#556B3F" strokeWidth="2" />
          <path d="M0,140 Q150,90 300,190 T600,140 T900,240" fill="none" stroke="#556B3F" strokeWidth="2" />
          
          {/* Main Route */}
          <path d="M100,400 L300,300 L500,350 L700,200 L850,250" fill="none" stroke="#B69B63" strokeWidth="4" strokeDasharray="8 4" className="opacity-60" />
        </svg>

        {/* Fictional Grid Labels */}
        <div className="absolute top-12 left-2 text-[8px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 24A</div>
        <div className="absolute top-12 right-2 text-[8px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 25B</div>
        <div className="absolute bottom-4 left-2 text-[8px] font-mono font-bold tracking-widest text-[#71805A] opacity-50">GRID 26C</div>

        {/* Map Markers */}
        {/* ALPHA */}
        <div className="absolute top-[30%] left-[25%] flex flex-col items-center group cursor-crosshair">
          <div className="text-[9px] font-black tracking-widest text-[#344438] bg-white/80 px-1 rounded mb-1">ALPHA</div>
          <div className="w-6 h-6 border-2 border-[#344438] bg-[#EEF3E8] flex items-center justify-center rotate-45">
            <Triangle size={10} className="text-[#344438] -rotate-45" fill="currentColor" />
          </div>
        </div>

        {/* BRAVO */}
        <div className="absolute top-[50%] left-[55%] flex flex-col items-center group cursor-crosshair">
          <div className="text-[9px] font-black tracking-widest text-[#344438] bg-white/80 px-1 rounded mb-1">BRAVO</div>
          <div className="w-6 h-6 border-2 border-[#344438] bg-[#EEF3E8] flex items-center justify-center rotate-45">
            <Triangle size={10} className="text-[#344438] -rotate-45" fill="currentColor" />
          </div>
        </div>

        {/* CHECKPOINT */}
        <div className="absolute top-[35%] right-[20%] flex flex-col items-center group cursor-crosshair">
          <div className="text-[9px] font-black tracking-widest text-[#556B3F] bg-white/80 px-1 rounded mb-1">CHECKPOINT</div>
          <Hexagon size={24} className="text-[#556B3F]" fill="#EEF3E8" />
        </div>

        {/* OBSERVATION */}
        <div className="absolute bottom-[25%] left-[40%] flex flex-col items-center group cursor-crosshair">
          <div className="text-[9px] font-black tracking-widest text-[#687066] bg-white/80 px-1 rounded mb-1">OBSERVATION</div>
          <CircleDot size={20} className="text-[#687066]" />
        </div>

        {/* REPORT (Pinging) */}
        <div className="absolute top-[45%] left-[30%] flex flex-col items-center">
          <div className="absolute w-8 h-8 rounded-full border-2 border-[#A94A3F] animate-ping opacity-75" />
          <div className="text-[9px] font-black tracking-widest text-[#A94A3F] bg-white/90 px-1 rounded mb-1">REPORT 017</div>
          <div className="w-3 h-3 rounded-full bg-[#A94A3F]" />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-white rounded border border-[#D9D8CE] shadow-sm flex flex-col overflow-hidden">
          <button className="p-2 text-[#344438] hover:bg-[#F7F5EE] border-b border-[#D9D8CE] transition-colors"><Plus size={16} /></button>
          <button className="p-2 text-[#344438] hover:bg-[#F7F5EE] border-b border-[#D9D8CE] transition-colors"><Minus size={16} /></button>
          <button className="p-2 text-[#344438] hover:bg-[#F7F5EE] transition-colors"><RotateCcw size={16} /></button>
        </div>
        <button className="bg-white rounded border border-[#D9D8CE] shadow-sm px-3 py-1.5 text-[9px] font-black tracking-widest text-[#344438] hover:bg-[#F7F5EE] transition-colors uppercase">
          Legend
        </button>
      </div>

    </div>
  );
}

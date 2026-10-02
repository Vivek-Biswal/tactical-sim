"use client";

import React from "react";
import { PanelCard } from "@/components/ui/PanelCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ShieldAlert, Crosshair } from "lucide-react";

export function SituationPanel() {
  return (
    <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Current Situation</span>} className="flex flex-col h-full">
      
      {/* Situation Status */}
      <div className="mb-5 pb-5 border-b border-[#D9D8CE]">
        <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-2">Situation Status</div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert size={20} className="text-[#8A5C2A]" />
          <span className="text-sm font-black text-[#263229]">COMMUNICATION DEGRADED</span>
        </div>
        <p className="text-xs text-[#687066] font-medium leading-relaxed">
          Information is arriving with delays and some reports may be incomplete.
        </p>
      </div>

      {/* Current Conditions */}
      <div className="mb-5 pb-5 border-b border-[#D9D8CE]">
        <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-3">Current Conditions</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-1">Visibility</div>
            <StatusBadge status="NORMAL" showDot={false} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-1">Communication</div>
            <StatusBadge status="DEGRADED" showDot={false} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-1">Map Data</div>
            <StatusBadge status="PENDING" label="DELAYED" showDot={false} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-1">Team Status</div>
            <StatusBadge status="READY" showDot={false} />
          </div>
        </div>
      </div>

      {/* Mission Objective */}
      <div className="bg-[#EFE8D8] border border-[#D8C7A5] rounded p-4 mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <Crosshair size={14} className="text-[#344438]" />
          <div className="text-[10px] font-black uppercase tracking-widest text-[#344438]">Mission Objective</div>
        </div>
        <p className="text-xs font-bold text-[#263229] leading-relaxed">
          Maintain operational awareness and select an appropriate response based on available information.
        </p>
      </div>
      
    </PanelCard>
  );
}

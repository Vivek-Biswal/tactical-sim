"use client";

import React from "react";
import { PanelCard } from "@/components/ui/PanelCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Radio } from "lucide-react";

export function CommunicationPanel() {
  const messages = [
    { time: "16:32", sender: "COMMAND", text: "Alpha, report current position.", type: "command" },
    { time: "16:34", sender: "ALPHA", text: "Position confirmed. Grid 24A.", type: "unit" },
    { time: "16:35", sender: "COMMAND", text: "Bravo, confirm activity.", type: "command" },
    { time: "16:37", sender: "BRAVO", text: "No activity observed.", type: "unit" },
    { time: "16:38", sender: "SYSTEM", text: "Transmission delayed.", type: "system" },
  ];

  return (
    <PanelCard header={
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-[#344438]">Communication</span>
        <StatusBadge status="DEGRADED" showDot={false} />
      </div>
    } className="flex flex-col h-full" noPadding>
      
      {/* Conditions */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-[#D9D8CE] bg-[#F7F5EE]">
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-[#8A5C2A]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#8A5C2A]">Primary Radio</span>
        </div>
        <StatusBadge status="DEGRADED" label="DELAYED" showDot={false} />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#D9D8CE] bg-[#F7F5EE]">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#687066]">Secondary</span>
        <StatusBadge status="PENDING" label="LIMITED" showDot={false} />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#D9D8CE] bg-[#F7F5EE]">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#687066]">Data Link</span>
        <StatusBadge status="DEGRADED" showDot={false} />
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-bold text-[#B69B63]">{msg.time}</span>
              <span className={`text-[10px] font-black tracking-widest ${
                msg.type === "command" ? "text-[#344438]" :
                msg.type === "unit" ? "text-[#556B3F]" :
                "text-[#A94A3F]"
              }`}>
                {msg.sender}
              </span>
            </div>
            <div className={`text-sm font-medium p-2.5 rounded-r-lg rounded-bl-lg ${
              msg.type === "command" ? "bg-[#EFE8D8] text-[#263229]" :
              msg.type === "unit" ? "bg-[#EEF3E8] text-[#263229] border border-[#556B3F]/20" :
              "bg-[#FAF0EF] text-[#A94A3F] italic text-xs font-mono"
            }`}>
              {msg.type === "system" ? msg.text : `"${msg.text}"`}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

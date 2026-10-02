import React, { useState } from "react";
import { MessageList } from "./MessageList";
import { RadioMessage } from "../../types/communication";
import { CommsStatus } from "../../types/scenario";
import { Send, WifiOff, Clock, Radio, AlertOctagon } from "lucide-react";

interface RadioPanelProps {
  messages: RadioMessage[];
  commsStatus: CommsStatus;
  radioDelaySeconds?: number;
  userRole?: string;
  userName?: string;
  onSendMessage: (content: string) => void;
  className?: string;
}

export const RadioPanel: React.FC<RadioPanelProps> = ({
  messages,
  commsStatus,
  radioDelaySeconds = 0,
  userRole = "COMMANDER",
  userName = "Commander",
  onSendMessage,
  className = ""
}) => {
  const [inputText, setInputText] = useState("");

  const isOffline = commsStatus === "offline";
  const isDelayed = commsStatus === "delayed";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleQuickTransmit = (preset: string) => {
    onSendMessage(preset);
  };

  return (
    <div className={`flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Radio Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">TACTICAL RADIO NET // VHF-4</span>
          <span className="text-slate-500">[{userRole}: {userName}]</span>
        </div>

        {/* Degradation Warning Banner */}
        {isOffline && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 font-bold animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span>SIGNAL LOST // CARRIER OFF</span>
          </div>
        )}
        {isDelayed && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>LATENCY: +{radioDelaySeconds || 8}s</span>
          </div>
        )}
      </div>

      {/* Transmissions Log */}
      <div className="flex-1 p-2 min-h-[140px] max-h-[220px] overflow-hidden flex flex-col">
        <MessageList messages={messages} className="flex-1" />
      </div>

      {/* Quick Tactical Presets */}
      <div className="px-2.5 py-1.5 bg-slate-950/40 border-t border-slate-800/80 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={isOffline}
          onClick={() => handleQuickTransmit("Team Alpha, report your status and visual bearings.")}
          className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-40"
        >
          Request SITREP
        </button>
        <button
          type="button"
          disabled={isOffline}
          onClick={() => handleQuickTransmit("All stations: Hold current perimeter. Await intelligence confirmation.")}
          className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-40"
        >
          Hold Perimeter
        </button>
        <button
          type="button"
          disabled={isOffline}
          onClick={() => handleQuickTransmit("Copy last transmission. Proceed with extreme vigilance.")}
          className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-40"
        >
          Acknowledge
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-2 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isOffline
              ? "RADIO OFFLINE — Outbound packets will be dropped by electronic jamming..."
              : isDelayed
              ? `Type radio transmission (will experience ${radioDelaySeconds || 8}s delay)...`
              : "Transmit tactical radio message..."
          }
          className={`flex-1 bg-slate-900 border rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none transition ${
            isOffline
              ? "border-rose-900/60 focus:border-rose-500 text-rose-300"
              : "border-slate-800 focus:border-cyan-500 text-slate-100"
          }`}
        />

        <button
          type="submit"
          className={`flex items-center space-x-1 px-3 py-1.5 rounded font-mono text-xs font-bold transition ${
            isOffline
              ? "bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
              : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          }`}
          title={isOffline ? "Carrier dropped: message will be dropped" : "Transmit"}
        >
          <span>TRANSMIT</span>
          <Send className="w-3.5 h-3.5 ml-1" />
        </button>
      </form>
    </div>
  );
};

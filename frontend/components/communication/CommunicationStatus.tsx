import React from "react";
import { CommsStatus, MapStatus } from "../../types/scenario";
import { getCommsStatusColor, getMapStatusColor } from "../../lib/utils";
import { Radio, Map, WifiOff, Clock, AlertTriangle } from "lucide-react";

interface CommunicationStatusProps {
  commsStatus: CommsStatus;
  mapStatus: MapStatus;
  radioDelaySeconds?: number;
  className?: string;
}

export const CommunicationStatus: React.FC<CommunicationStatusProps> = ({
  commsStatus,
  mapStatus,
  radioDelaySeconds = 0,
  className = ""
}) => {
  const commsStyle = getCommsStatusColor(commsStatus);
  const mapStyle = getMapStatusColor(mapStatus);

  return (
    <div className={`flex flex-wrap items-center gap-2 font-mono text-xs ${className}`}>
      {/* Radio Net Status Badge */}
      <div
        className={`flex items-center space-x-2 px-2.5 py-1 rounded border transition-all ${commsStyle.bg} ${commsStyle.border} ${commsStyle.glow}`}
      >
        <div className="flex items-center space-x-1.5">
          {commsStatus === "offline" ? (
            <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          ) : (
            <Radio className={`w-3.5 h-3.5 ${commsStyle.text}`} />
          )}
          <span className="text-slate-400 font-bold">RADIO:</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`w-2 h-2 rounded-full ${commsStyle.dot} ${commsStatus !== "normal" ? "animate-ping" : ""}`} />
          <span className={`font-bold ${commsStyle.text}`}>
            {commsStyle.label}
            {commsStatus === "delayed" && radioDelaySeconds > 0 && ` (+${radioDelaySeconds}s)`}
          </span>
        </div>
      </div>

      {/* Map Status Badge */}
      <div className={`flex items-center space-x-2 px-2.5 py-1 rounded border ${mapStyle.bg} ${mapStyle.border}`}>
        <div className="flex items-center space-x-1.5">
          {mapStatus === "outdated" ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Map className={`w-3.5 h-3.5 ${mapStyle.text}`} />
          )}
          <span className="text-slate-400 font-bold">MAP:</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`w-2 h-2 rounded-full ${mapStyle.dot}`} />
          <span className={`font-bold ${mapStyle.text}`}>{mapStyle.label}</span>
        </div>
      </div>
    </div>
  );
};

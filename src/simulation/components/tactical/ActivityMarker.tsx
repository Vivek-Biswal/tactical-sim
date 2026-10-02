import React from "react";
import { ActivityMarker as ActivityMarkerType } from "../../types/scenario";

interface ActivityMarkerProps {
  marker: ActivityMarkerType;
  onClick?: () => void;
}

export const ActivityMarker: React.FC<ActivityMarkerProps> = ({ marker, onClick }) => {
  if (marker.type === "hostile_jammer") {
    return (
      <g transform={`translate(${marker.x}, ${marker.y})`} className="cursor-pointer select-none" onClick={onClick}>
        {/* Concentric EW Radio Interference Waves */}
        <circle r="40" fill="none" stroke="#A94A3F" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" className="animate-ping" />
        <circle r="25" fill="none" stroke="#A94A3F" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.6" />
        
        {/* Hostile Diamond Icon */}
        <path d="M 0 -14 L 14 0 L 0 14 L -14 0 Z" fill="#450a0a" stroke="#A94A3F" strokeWidth="2" />
        <text x="0" y="4" textAnchor="middle" fill="#A94A3F" fontSize="10" fontWeight="bold">
          EW
        </text>

        {/* Label Box */}
        <g transform="translate(18, -12)">
          <rect x="-4" y="-8" width="175" height="18" fill="#FFFFFF" fillOpacity="0.9" stroke="#A94A3F" rx="2" />
          <text x="0" y="4" fill="#f87171" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            {marker.label}
          </text>
        </g>
      </g>
    );
  }

  if (marker.type === "contact_warning") {
    return (
      <g transform={`translate(${marker.x}, ${marker.y})`} className="cursor-pointer select-none" onClick={onClick}>
        {/* Radar Ring */}
        <circle r="20" fill="#78350f" fillOpacity="0.3" stroke="#B87A3A" strokeWidth="1.5" strokeDasharray="2,2" className="animate-pulse" />
        
        {/* Warning Triangle */}
        <path d="M 0 -10 L 10 8 L -10 8 Z" fill="#1c1917" stroke="#B87A3A" strokeWidth="1.8" />
        <text x="0" y="5" textAnchor="middle" fill="#B87A3A" fontSize="10" fontWeight="bold">
          ?
        </text>

        {/* Label */}
        <g transform="translate(14, -8)">
          <rect x="-2" y="-6" width="180" height="16" fill="#FFFFFF" fillOpacity="0.9" stroke="#B87A3A" rx="2" />
          <text x="2" y="5" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {marker.label}
          </text>
        </g>
      </g>
    );
  }

  // Checkpoint or Default
  return (
    <g transform={`translate(${marker.x}, ${marker.y})`} className="cursor-pointer select-none" onClick={onClick}>
      <circle r="12" fill="#FFFFFF" stroke="#556B3F" strokeWidth="1.5" strokeDasharray="2,2" />
      <circle r="4" fill="#556B3F" />
      <g transform="translate(16, -6)">
        <text x="0" y="8" fill="#556B3F" fontSize="9" fontFamily="monospace">
          {marker.label}
        </text>
      </g>
    </g>
  );
};

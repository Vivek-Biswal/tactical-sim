import React from "react";
import { TacticalUnit } from "../../types/scenario";

interface TeamMarkerProps {
  unit: TacticalUnit;
  isSelected?: boolean;
  onClick?: () => void;
  isStale?: boolean;
}

export const TeamMarker: React.FC<TeamMarkerProps> = ({
  unit,
  isSelected = false,
  onClick,
  isStale = false
}) => {
  const isHostileOrObjective = unit.id === "objective-bravo";

  const mainColor = isHostileOrObjective
    ? "#f59e0b" // Objective: amber
    : isStale
    ? "#94a3b8" // Stale: muted gray
    : "#38bdf8"; // Friendly: tactical cyan

  return (
    <g
      transform={`translate(${unit.x}, ${unit.y})`}
      className="cursor-pointer transition-transform duration-500 ease-out select-none"
      onClick={onClick}
    >
      {/* Outer Glow / Ping */}
      <circle
        r={isSelected ? "22" : "16"}
        fill="none"
        stroke={mainColor}
        strokeWidth="1.5"
        strokeDasharray={isStale ? "4,4" : "none"}
        opacity={isStale ? 0.4 : 0.7}
        className={isStale ? "" : "animate-pulse"}
      />

      {/* Heading Azimuth Line */}
      {unit.heading !== undefined && (
        <line
          x1="0"
          y1="0"
          x2={Math.cos(((unit.heading - 90) * Math.PI) / 180) * 24}
          y2={Math.sin(((unit.heading - 90) * Math.PI) / 180) * 24}
          stroke={mainColor}
          strokeWidth="2"
        />
      )}

      {/* Main Tactical Symbol Box */}
      <rect
        x="-11"
        y="-11"
        width="22"
        height="22"
        fill="#090d16"
        stroke={mainColor}
        strokeWidth="2"
        rx="3"
      />

      {/* NATO Friendly / Objective Glyph */}
      {isHostileOrObjective ? (
        // Waypoint Diamond
        <path d="M 0 -6 L 6 0 L 0 6 L -6 0 Z" fill={mainColor} />
      ) : (
        // Friendly Infantry / Recon Cross
        <g stroke={mainColor} strokeWidth="1.5">
          <line x1="-6" y1="-6" x2="6" y2="6" />
          <line x1="-6" y1="6" x2="6" y2="-6" />
        </g>
      )}

      {/* Callsign & Role Badge */}
      <g transform="translate(18, -4)">
        <rect
          x="-2"
          y="-10"
          width={unit.name.length * 6.8 + 8}
          height="16"
          fill="#090d16"
          fillOpacity="0.85"
          stroke="#1e293b"
          rx="2"
        />
        <text
          x="2"
          y="2"
          fill={mainColor}
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {unit.callsign || unit.name}
        </text>
      </g>

      {/* Coordinates / Status Pill */}
      <text
        x="18"
        y="18"
        fill="#64748b"
        fontSize="8"
        fontFamily="monospace"
      >
        {isStale ? "[STALE COP]" : `${Math.round(unit.x)},${Math.round(unit.y)}`}
      </text>
    </g>
  );
};

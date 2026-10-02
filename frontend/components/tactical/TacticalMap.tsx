import React, { useState } from "react";
import { TacticalGrid } from "./TacticalGrid";
import { TeamMarker } from "./TeamMarker";
import { ActivityMarker } from "./ActivityMarker";
import { MapLegend } from "./MapLegend";
import { TacticalUnit, ActivityMarker as ActivityMarkerType, MapStatus } from "../../types/scenario";
import { AlertTriangle, Clock, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

interface TacticalMapProps {
  units: TacticalUnit[];
  activityMarkers?: ActivityMarkerType[];
  mapStatus?: MapStatus;
  mapLastUpdated?: string;
  onUnitSelect?: (unit: TacticalUnit) => void;
  className?: string;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  units,
  activityMarkers = [],
  mapStatus = "current",
  mapLastUpdated = "Live Telemetry Active",
  onUnitSelect,
  className = ""
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const isStale = mapStatus === "outdated";

  const handleUnitClick = (unit: TacticalUnit) => {
    setSelectedUnitId(unit.id);
    if (onUnitSelect) onUnitSelect(unit);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCursorPos({ x, y });
  };

  return (
    <div className={`relative w-full h-full bg-[#080c14] border border-slate-800 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Top Map HUD Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono z-10">
        <div className="flex items-center space-x-3">
          <span className="text-cyan-400 font-bold tracking-wider">COP TACTICAL DISPLAY</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">AREA: SECTOR 7 (OBSIDIAN RIDGE)</span>
        </div>

        <div className="flex items-center space-x-4">
          {cursorPos && (
            <span className="text-slate-400 hidden sm:inline">
              MGRS: <span className="text-slate-200">31U DQ {cursorPos.x.toString().padStart(3, "0")} {cursorPos.y.toString().padStart(3, "0")}</span>
            </span>
          )}

          {/* Map Telemetry Status Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${
              isStale
                ? "bg-amber-950/70 border-amber-500/60 text-amber-400 animate-pulse"
                : "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
            }`}
          >
            {isStale ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{mapLastUpdated}</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                title="Reset zoom"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Tactical Workspace */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#070b12]">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-contain select-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.2s ease-out" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
        >
          <defs>
            {/* Elevation Shading Gradients */}
            <radialGradient id="hill-ridge-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#070b12" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hill-eastern-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#070b12" stopOpacity="0" />
            </radialGradient>

            {/* Jammer Interference Scan Overlay */}
            <pattern id="stale-scanline" width="10" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="0" stroke="#f59e0b" strokeWidth="0.8" opacity="0.12" />
            </pattern>
          </defs>

          {/* Terrain Base & Shaded Elevation Contours */}
          <g className="terrain-contours">
            {/* Western Ridge Terrain Feature */}
            <ellipse cx="230" cy="220" rx="140" ry="110" fill="url(#hill-ridge-gradient)" />
            <path
              d="M 120 220 Q 230 140 340 220 Q 240 300 120 220 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <path
              d="M 160 220 Q 230 170 300 220 Q 235 270 160 220 Z"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
            />
            <text x="180" y="225" fill="#64748b" fontSize="11" fontFamily="monospace" letterSpacing="1">
              ▲ WESTERN RIDGE (ELEV 420m)
            </text>

            {/* Eastern Canyon Flank Feature */}
            <ellipse cx="680" cy="340" rx="130" ry="120" fill="url(#hill-eastern-gradient)" />
            <path
              d="M 570 340 Q 680 250 780 340 Q 680 430 570 340 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <text x="615" y="345" fill="#64748b" fontSize="11" fontFamily="monospace" letterSpacing="1">
              ▲ EASTERN CANYON BLUFFS
            </text>

            {/* Defile Pass Warning Zone */}
            <path
              d="M 370 180 L 490 140 L 510 260 L 390 300 Z"
              fill="#1e1b4b"
              fillOpacity="0.2"
              stroke="#4338ca"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text x="400" y="235" fill="#818cf8" fontSize="10" fontFamily="monospace">
              [DEFILE BRAVO PASS]
            </text>
          </g>

          {/* Road / Mobility Corridors */}
          <g className="road-corridors">
            {/* Primary Highway Corridor */}
            <path
              d="M 80 560 Q 220 480 320 380 T 580 210 T 750 140"
              fill="none"
              stroke="#334155"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 80 560 Q 220 480 320 380 T 580 210 T 750 140"
              fill="none"
              stroke="#475569"
              strokeWidth="2.5"
              strokeDasharray="8,6"
            />

            {/* Secondary Ridge Trail */}
            <path
              d="M 220 380 Q 200 280 230 180 T 420 120 T 580 210"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeDasharray="4,4"
            />
            <text x="135" y="440" fill="#475569" fontSize="9" fontFamily="monospace" transform="rotate(-30 135 440)">
              MAIN HIGHWAY ROUTE
            </text>
            <text x="210" y="300" fill="#475569" fontSize="9" fontFamily="monospace" transform="rotate(-75 210 300)">
              WESTERN RIDGE PASS (BYPASS)
            </text>
          </g>

          {/* Coordinate Grid & Watermarks */}
          <TacticalGrid width={800} height={600} />

          {/* Waypoint Route Planning Lines */}
          <line
            x1="220"
            y1="380"
            x2="580"
            y2="210"
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            opacity={0.4}
          />

          {/* Activity & Contact Markers */}
          {activityMarkers.map((marker) => (
            <ActivityMarker key={marker.id} marker={marker} />
          ))}

          {/* Tactical Units */}
          {units.map((unit) => (
            <TeamMarker
              key={unit.id}
              unit={unit}
              isSelected={selectedUnitId === unit.id}
              isStale={isStale}
              onClick={() => handleUnitClick(unit)}
            />
          ))}

          {/* Outdated / Frozen COP Overlay Effect */}
          {isStale && (
            <g className="stale-overlay pointer-events-none select-none">
              <rect width="800" height="600" fill="url(#stale-scanline)" />
              <rect x="250" y="15" width="300" height="30" fill="#451a03" fillOpacity="0.85" stroke="#f59e0b" rx="4" />
              <text x="400" y="35" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold" fontFamily="monospace">
                ⚠ STALE COP TELEMETRY - SATELLITE DATA DENIED
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <MapLegend />
      </div>
    </div>
  );
};

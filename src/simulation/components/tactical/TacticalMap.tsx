"use client";

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

  const isStale = mapStatus !== "current";
  const unavailable = mapStatus === "unavailable";

  const handleUnitClick = (e: React.MouseEvent, unit: TacticalUnit) => {
    e.stopPropagation();
    setSelectedUnitId(unit.id);
    if (onUnitSelect) onUnitSelect(unit);
  };

  const handleMapClick = () => {
    setSelectedUnitId(null);
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    setCursorPos({ x, y });
  };

  return (
    <div className={`relative w-full h-full bg-[#F7F5EE] border border-[#D9D8CE] rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Top Map HUD Bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between px-3 py-1.5 bg-white/95 border-b border-[#D9D8CE] text-xs font-mono z-10">
        <div className="flex items-center space-x-3">
          <span className="text-[#556B3F] font-bold tracking-wider">COP TACTICAL DISPLAY</span>
          <span className="text-[#687066]">|</span>
          <span className="text-[#687066]">AREA: SECTOR 7 (OBSIDIAN RIDGE)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cursorPos && (
            <span className="text-[#687066] hidden sm:inline">
              LOCAL GRID: <span className="text-[#263229]">{cursorPos.x.toString().padStart(3, "0")} {cursorPos.y.toString().padStart(3, "0")}</span>
            </span>
          )}

          {/* Map Telemetry Status Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${
              isStale
                ? "bg-[#FDF3E3] border-amber-500/60 text-[#8A5C2A] animate-pulse"
                : "bg-[#EEF3E8] border-emerald-500/50 text-[#556B3F]"
            }`}
          >
            {isStale ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span className="capitalize">{mapStatus}: {mapLastUpdated}</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-[#EFE8D8] rounded text-[#687066] hover:text-[#263229] transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 hover:bg-[#EFE8D8] rounded text-[#687066] hover:text-[#263229] transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:bg-[#EFE8D8] rounded text-[#687066] hover:text-[#263229] transition"
                title="Reset zoom"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Tactical Workspace */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#F7F5EE]">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-contain select-none cursor-crosshair"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.2s ease-out" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
          onClick={handleMapClick}
        >
          <defs>
            {/* Elevation Shading Gradients */}
            <radialGradient id="hill-ridge-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9D8CE" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#EFE8D8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hill-eastern-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9D8CE" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#EFE8D8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0" />
            </radialGradient>

            {/* Jammer Interference Scan Overlay */}
            <pattern id="stale-scanline" width="10" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="0" stroke="#B87A3A" strokeWidth="0.8" opacity="0.12" />
            </pattern>

            {/* Forest Pattern */}
            <pattern id="forest-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="8" fill="#064e3b" opacity="0.4" />
              <circle cx="4" cy="4" r="5" fill="#065f46" opacity="0.3" />
            </pattern>
          </defs>

          {/* Water Features */}
          <g className="water-features">
            <path
              d="M 400 0 Q 380 150 450 300 T 400 600"
              fill="none"
              stroke="#0369a1"
              strokeWidth="24"
              opacity="0.6"
              strokeLinecap="round"
            />
            <path
              d="M 400 0 Q 380 150 450 300 T 400 600"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
              opacity="0.8"
              strokeDasharray="10,15"
            />
            <text x="460" y="100" fill="#556B3F" fontSize="11" fontFamily="monospace" transform="rotate(75 460 100)" opacity="0.7">
              SERPENT RIVER
            </text>
          </g>

          {/* Terrain Base & Shaded Elevation Contours */}
          <g className="terrain-contours">
            {/* Forest Area */}
            <path
              d="M 60 60 Q 150 40 180 120 Q 200 200 100 220 Q 30 180 60 60 Z"
              fill="url(#forest-pattern)"
              stroke="#064e3b"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text x="80" y="140" fill="#34d399" fontSize="10" fontFamily="monospace" opacity="0.8">
              [WHISPERING PINES]
            </text>

            {/* Western Ridge Terrain Feature */}
            <ellipse cx="230" cy="220" rx="140" ry="110" fill="url(#hill-ridge-gradient)" />
            <path
              d="M 120 220 Q 230 140 340 220 Q 240 300 120 220 Z"
              fill="none"
              stroke="#71805A"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <path
              d="M 160 220 Q 230 170 300 220 Q 235 270 160 220 Z"
              fill="none"
              stroke="#687066"
              strokeWidth="1"
            />
            <text x="180" y="225" fill="#687066" fontSize="11" fontFamily="monospace" letterSpacing="1">
              ▲ WESTERN RIDGE (ELEV 420m)
            </text>

            {/* Eastern Canyon Flank Feature */}
            <ellipse cx="680" cy="340" rx="130" ry="120" fill="url(#hill-eastern-gradient)" />
            <path
              d="M 570 340 Q 680 250 780 340 Q 680 430 570 340 Z"
              fill="none"
              stroke="#71805A"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <text x="615" y="345" fill="#687066" fontSize="11" fontFamily="monospace" letterSpacing="1">
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
              stroke="#71805A"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 80 560 Q 220 480 320 380 T 580 210 T 750 140"
              fill="none"
              stroke="#687066"
              strokeWidth="2.5"
              strokeDasharray="8,6"
            />

            {/* Secondary Ridge Trail */}
            <path
              d="M 220 380 Q 200 280 230 180 T 420 120 T 580 210"
              fill="none"
              stroke="#D9D8CE"
              strokeWidth="3.5"
              strokeDasharray="4,4"
            />
            <text x="135" y="440" fill="#687066" fontSize="9" fontFamily="monospace" transform="rotate(-30 135 440)">
              MAIN HIGHWAY ROUTE
            </text>
            <text x="210" y="300" fill="#687066" fontSize="9" fontFamily="monospace" transform="rotate(-75 210 300)">
              WESTERN RIDGE PASS (BYPASS)
            </text>
          </g>

          {/* Infrastructure */}
          <g className="infrastructure">
            {/* Village / City Area */}
            <g transform="translate(250, 400)">
              <rect x="0" y="0" width="80" height="60" fill="#D9D8CE" opacity="0.6" stroke="#687066" />
              <rect x="10" y="10" width="20" height="15" fill="#71805A" />
              <rect x="40" y="10" width="25" height="20" fill="#71805A" />
              <rect x="15" y="35" width="45" height="15" fill="#71805A" />
              <text x="40" y="-8" textAnchor="middle" fill="#687066" fontSize="10" fontFamily="monospace">
                NOVA SETTLEMENT
              </text>
            </g>
            
            {/* Military Base / HQ */}
            <g transform="translate(600, 450)">
              <polygon points="0,30 40,0 80,30 80,80 0,80" fill="#EFE8D8" stroke="#687066" strokeWidth="2" strokeDasharray="5,3" />
              <rect x="25" y="30" width="30" height="30" fill="#D9D8CE" stroke="#687066" />
              <circle cx="40" cy="45" r="5" fill="#A94A3F" opacity="0.8" />
              <text x="40" y="95" textAnchor="middle" fill="#344438" fontSize="10" fontFamily="monospace" fontWeight="bold">
                FOB VANGUARD (HQ)
              </text>
            </g>

            {/* Bridge (Highway crossing Serpent River) */}
            <g transform="translate(450, 290) rotate(-35)">
              <rect x="-15" y="-15" width="30" height="30" fill="#D9D8CE" stroke="#eab308" strokeWidth="1.5" />
              <line x1="-15" y1="-5" x2="15" y2="-5" stroke="#eab308" strokeWidth="1" />
              <line x1="-15" y1="5" x2="15" y2="5" stroke="#eab308" strokeWidth="1" />
              <text x="0" y="-20" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace">
                BRIDGE 7A
              </text>
            </g>
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
          {(unavailable ? [] : activityMarkers).map((marker) => (
            <ActivityMarker key={marker.id} marker={marker} />
          ))}

          {/* Tactical Units */}
          {(unavailable ? [] : units).map((unit) => (
            <TeamMarker
              key={unit.id}
              unit={unit}
              isSelected={selectedUnitId === unit.id}
              isStale={isStale}
              onClick={(e) => handleUnitClick(e, unit)}
            />
          ))}

          {/* Outdated / Frozen COP Overlay Effect */}
          {isStale && (
            <g className="stale-overlay pointer-events-none select-none">
              <rect width="800" height="600" fill="url(#stale-scanline)" />
              <rect x="250" y="15" width="300" height="30" fill="#451a03" fillOpacity="0.85" stroke="#B87A3A" rx="4" />
              <text x="400" y="35" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold" fontFamily="monospace">
                ⚠ STALE COP TELEMETRY - SATELLITE DATA DENIED
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <MapLegend />

        {/* Unit Information Panel */}
        {selectedUnit && !unavailable && (
          <div className="absolute top-4 right-4 w-64 bg-white/95 border border-[#D9D8CE] rounded shadow-xl pointer-events-auto z-20 overflow-hidden">
            <div className="bg-[#EEF3E8] px-3 py-1.5 border-b border-[#D9D8CE] flex justify-between items-center">
              <span className="text-[#556B3F] font-bold text-sm tracking-wider">UNIT INFO</span>
              <button aria-label="Close unit details" onClick={() => setSelectedUnitId(null)} className="text-[#687066] hover:text-[#263229]">&times;</button>
            </div>
            <div className="p-3 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">NAME:</span>
                <span className="col-span-2 text-[#263229]">{selectedUnit.name} ({selectedUnit.callsign})</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">TYPE:</span>
                <span className="col-span-2 text-[#263229]">{selectedUnit.type || selectedUnit.role}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">FACTION:</span>
                <span className={`col-span-2 capitalize font-semibold ${
                  selectedUnit.faction === 'friendly' ? 'text-[#556B3F]' :
                  selectedUnit.faction === 'hostile' ? 'text-red-400' : 'text-[#8A5C2A]'
                }`}>{selectedUnit.faction || "Unknown"}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">STATUS:</span>
                <span className="col-span-2 capitalize text-[#344438]">{selectedUnit.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">SECTOR:</span>
                <span className="col-span-2 text-[#344438]">
                  {selectedUnit.sector || "Unknown"} [{Math.round(selectedUnit.x)}, {Math.round(selectedUnit.y)}]
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-[#687066]">COMMS:</span>
                <span className={`col-span-2 ${
                  selectedUnit.communicationStatus === 'NORMAL' ? 'text-[#556B3F]' :
                  selectedUnit.communicationStatus === 'LOST' ? 'text-red-500' : 'text-[#8A5C2A]'
                }`}>{selectedUnit.communicationStatus || "UNKNOWN"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useId } from "react";

/** Fictional terrain, independent of the positional telemetry feed. */
export function TacticalTerrain() {
  const id = useId();
  return <g aria-label="Terrain: hills, forest, river, roads and buildings" className="pointer-events-none">
          <defs>
            {/* Elevation Shading Gradients */}
            <radialGradient id={`${id}-ridge`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9D8CE" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#EFE8D8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0" />
            </radialGradient>

            <radialGradient id={`${id}-east`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9D8CE" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#EFE8D8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F7F5EE" stopOpacity="0" />
            </radialGradient>

            {/* Jammer Interference Scan Overlay */}
            <pattern id={`${id}-scan`} width="10" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="10" y2="0" stroke="#B87A3A" strokeWidth="0.8" opacity="0.12" />
            </pattern>

            {/* Forest Pattern */}
            <pattern id={`${id}-forest`} width="20" height="20" patternUnits="userSpaceOnUse">
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
              fill={`url(#${id}-forest)`}
              stroke="#064e3b"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text x="80" y="140" fill="#556B3F" fontSize="10" fontFamily="monospace" opacity="0.8">
              [WHISPERING PINES]
            </text>

            {/* Western Ridge Terrain Feature */}
            <ellipse cx="230" cy="220" rx="140" ry="110" fill={`url(#${id}-ridge)`} />
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
            <ellipse cx="680" cy="340" rx="130" ry="120" fill={`url(#${id}-east)`} />
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
              <rect x="-15" y="-15" width="30" height="30" fill="#D9D8CE" stroke="#B69B63" strokeWidth="1.5" />
              <line x1="-15" y1="-5" x2="15" y2="-5" stroke="#B69B63" strokeWidth="1" />
              <line x1="-15" y1="5" x2="15" y2="5" stroke="#B69B63" strokeWidth="1" />
              <text x="0" y="-20" textAnchor="middle" fill="#8A5C2A" fontSize="8" fontFamily="monospace">
                BRIDGE 7A
              </text>
            </g>
          </g>


</g>;
}

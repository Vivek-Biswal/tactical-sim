import { useId } from "react";
import { getTrainingPreset } from "../../lib/geography";
import type { TrainingArea, TrainingPreset } from "../../types/geography";
import type { Point } from "../../lib/mapGeometry";

const points = (vertices: Point[]) => vertices.map(p => `${p.x},${p.y}`).join(" ");

function TerrainLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <text x={x} y={y} fill="#596452" fontSize={15} fontWeight={600} paintOrder="stroke" stroke="#F7F5EE" strokeWidth={4} strokeLinejoin="round">{children}</text>;
}

function Contours({ x, y, rx, ry, snow = false }: { x: number; y: number; rx: number; ry: number; snow?: boolean }) {
  return <g><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={snow ? "#E5E5DA" : "#DDE3CD"} opacity={0.7}/>{[1, 0.78, 0.55, 0.32].map(scale => <ellipse key={scale} cx={x} cy={y} rx={rx * scale} ry={ry * scale} fill="none" stroke="#869473" strokeWidth={1.3} opacity={0.8}/>)}{snow && <path d={`M${x-20} ${y+9}l20-30 20 30-13-6-7 4-8-5z`} fill="#FEFDF9" stroke="#A9B19C"/>}</g>;
}

function PresetTerrain({ preset }: { preset: TrainingPreset }) {
  const id = useId();
  const waterBase = ["water", "coast", "island"].includes(preset.surface);
  const terrain = preset.terrain;
  const groundRoute = preset.routes.ground;
  return <g className="pointer-events-none" aria-label={`Schematic ${terrain} training terrain`}>
    <defs>
      <pattern id={`${id}-water`} width={65} height={45} patternUnits="userSpaceOnUse"><path d="M8 22q9-7 18 0t18 0" fill="none" stroke="#9CBFC4" strokeWidth={1} opacity={0.55}/></pattern>
      <pattern id={`${id}-trees`} width={37} height={34} patternUnits="userSpaceOnUse"><path d="M18 8l-9 15h18z" fill="#9CAD80" opacity={0.65}/><path d="M18 22v6" stroke="#80946A" strokeWidth={2}/></pattern>
      <clipPath id={`${id}-waterClip`}>{preset.waterPolygons.map((polygon, index) => <polygon key={index} points={points(polygon)}/>)}</clipPath>
    </defs>
    <rect width={800} height={600} fill={waterBase ? "#D8E9E7" : terrain === "desert" ? "#EFE4C8" : terrain === "forest" ? "#E4EAD9" : "#F1F1E5"}/>
    {waterBase && <rect width={800} height={600} fill={`url(#${id}-water)`}/>}
    {preset.landPolygons.map((polygon, index) => <polygon key={`land-${index}`} points={points(polygon)} fill="#E7E6CE" stroke="#ADA887" strokeWidth={3}/>)}
    {preset.waterPolygons.map((polygon, index) => <polygon key={`water-${index}`} points={points(polygon)} fill="#D8E9E7" stroke="#9EBDB8" strokeWidth={3}/>)}
    {preset.waterPolygons.length > 0 && <rect width={800} height={600} fill={`url(#${id}-water)`} clipPath={`url(#${id}-waterClip)`}/>}
    {terrain === "mountain" && <><Contours x={200} y={170} rx={150} ry={120} snow/><Contours x={570} y={340} rx={170} ry={170} snow/><Contours x={210} y={510} rx={130} ry={65} snow/><TerrainLabel x={110} y={160}>Mountain slopes</TerrainLabel><TerrainLabel x={510} y={330}>High ridge</TerrainLabel></>}
    {terrain === "hills" && <><Contours x={210} y={165} rx={140} ry={115}/><Contours x={600} y={370} rx={170} ry={145}/><ellipse cx={600} cy={130} rx={140} ry={80} fill={`url(#${id}-trees)`}/><TerrainLabel x={110} y={170}>Rolling hills</TerrainLabel><TerrainLabel x={530} y={370}>Hill slopes</TerrainLabel><TerrainLabel x={520} y={120}>Wooded area</TerrainLabel></>}
    {terrain === "range" && <><g transform="rotate(-25 400 300)">{[150, 285, 420].map(y => <g key={y}><ellipse cx={400} cy={y} rx={300} ry={53} fill="#DEE2CE"/>{[0, 13, 25].map(inset => <ellipse key={inset} cx={400} cy={y} rx={300-inset*4} ry={53-inset} fill="none" stroke="#889476"/>)}</g>)}</g><TerrainLabel x={430} y={170}>Connected ridges</TerrainLabel><TerrainLabel x={150} y={520}>Pass between ridges</TerrainLabel></>}
    {terrain === "valley" && <><path d="M0 0h200l150 200 80 400H0zM800 0H610l-50 250 35 350h205z" fill="#DDDCC8"/>{[30,70,110].map(i => <g key={i} fill="none" stroke="#A9AC91"><path d={`M${180-i} 0Q${300-i} 260 ${370-i} 600`}/><path d={`M${620+i} 0Q${520+i} 250 ${620+i} 600`}/></g>)}<TerrainLabel x={380} y={340}>Valley floor</TerrainLabel><TerrainLabel x={40} y={170}>Mountain slope</TerrainLabel><TerrainLabel x={620} y={470}>Mountain slope</TerrainLabel></>}
    {terrain === "volcano" && <><Contours x={405} y={295} rx={105} ry={100}/><circle cx={405} cy={295} r={35} fill="#B8AD91" stroke="#93896E" strokeWidth={3}/><circle cx={405} cy={295} r={18} fill="#716C5B"/><TerrainLabel x={350} y={360}>Volcanic crater</TerrainLabel><TerrainLabel x={70} y={80}>Andaman Sea</TerrainLabel><TerrainLabel x={590} y={560}>Offshore training water</TerrainLabel></>}
    {terrain === "sea" && <><path d="M622 0v600" stroke="#CEC397" strokeWidth={13}/><TerrainLabel x={170} y={80}>Arabian Sea</TerrainLabel><TerrainLabel x={645} y={100}>Coast / land</TerrainLabel><TerrainLabel x={55} y={550}>Open water</TerrainLabel></>}
    {terrain === "river" && <><TerrainLabel x={300} y={285}>River water</TerrainLabel><TerrainLabel x={75} y={175}>North river bank</TerrainLabel><TerrainLabel x={515} y={450}>South river bank</TerrainLabel><path d="M70 240h75l-9-6m9 6-9 6M575 360h75l-9-6m9 6-9 6" stroke="#80A5A2" fill="none" strokeWidth={2}/></>}
    {terrain === "lake" && <><TerrainLabel x={340} y={280}>Lake / lagoon water</TerrainLabel><TerrainLabel x={50} y={100}>Shore-side land</TerrainLabel><TerrainLabel x={580} y={560}>Shoreline</TerrainLabel></>}
    {terrain === "desert" && <>{[90,180,280,390,500].map((y, index) => <g key={y}><path d={`M20 ${y}Q210 ${y-85} 410 ${y}T780 ${y}`} stroke="#CCBA8A" strokeWidth={2} fill="none"/><path d={`M20 ${y+12}Q210 ${y-73} 410 ${y+12}T780 ${y+12}`} stroke="#DACEAB" strokeWidth={index%2===0?9:5} fill="none"/></g>)}<TerrainLabel x={480} y={200}>Sand dunes</TerrainLabel><TerrainLabel x={80} y={550}>Open desert</TerrainLabel></>}
    {terrain === "forest" && <><path d="M35 35h280l75 175-90 115H35zM530 180h240v370H500l-70-190z" fill={`url(#${id}-trees)`}/><Contours x={550} y={140} rx={160} ry={85}/><TerrainLabel x={80} y={100}>Wooded slopes</TerrainLabel><TerrainLabel x={470} y={440}>Forest cover</TerrainLabel><TerrainLabel x={150} y={535}>Open clearing</TerrainLabel></>}
    {groundRoute.length > 1 && <><polyline points={points([...groundRoute, groundRoute[0]])} fill="none" stroke="#DEDAC7" strokeWidth={10} strokeLinejoin="round"/><polyline points={points([...groundRoute, groundRoute[0]])} fill="none" stroke="#8A9078" strokeWidth={2} strokeDasharray="7 5" strokeLinejoin="round"/><TerrainLabel x={groundRoute[0].x+8} y={groundRoute[0].y+35}>Training road / trail</TerrainLabel></>}
  </g>;
}

export function TacticalTerrain({ trainingArea }: { trainingArea?: TrainingArea }) {
  const preset = trainingArea && getTrainingPreset(trainingArea);
  return preset ? <PresetTerrain preset={preset}/> : <LegacyTerrain/>;
}

/** Fictional terrain, independent of the positional telemetry feed. */
function LegacyTerrain() {
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

import React from "react";

interface TacticalGridProps {
  width?: number;
  height?: number;
}

export const TacticalGrid: React.FC<TacticalGridProps> = ({ width = 800, height = 600 }) => {
  const gridSize = 50;
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);

  return (
    <g className="tactical-grid opacity-30 select-none pointer-events-none">
      <defs>
        <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.8"
            strokeDasharray="2,2"
          />
        </pattern>
      </defs>

      <rect width={width} height={height} fill="url(#grid-pattern)" />

      {/* Grid Coordinates */}
      {Array.from({ length: cols }).map((_, i) => (
        <text
          key={`col-${i}`}
          x={i * gridSize + 4}
          y={14}
          fill="#475569"
          fontSize="9"
          fontFamily="monospace"
        >
          {String.fromCharCode(65 + i)}
        </text>
      ))}

      {Array.from({ length: rows }).map((_, j) => (
        <text
          key={`row-${j}`}
          x={4}
          y={j * gridSize + 14}
          fill="#475569"
          fontSize="9"
          fontFamily="monospace"
        >
          {j + 1}
        </text>
      ))}

      {/* Sector Boundary Reference Markings */}
      <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="#334155" strokeWidth="1" strokeDasharray="6,6" opacity={0.4} />
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeWidth="1" strokeDasharray="6,6" opacity={0.4} />

      {/* Sector Name Watermarks */}
      <text x={70} y={50} fill="#334155" fontSize="12" fontWeight="bold" letterSpacing="2">
        SECTOR 7-A [RIDGE]
      </text>
      <text x={width - 190} y={50} fill="#334155" fontSize="12" fontWeight="bold" letterSpacing="2">
        SECTOR 7-B [HIGHWAY]
      </text>
      <text x={70} y={height - 25} fill="#334155" fontSize="12" fontWeight="bold" letterSpacing="2">
        SECTOR 7-C [RALLY]
      </text>
      <text x={width - 190} y={height - 25} fill="#334155" fontSize="12" fontWeight="bold" letterSpacing="2">
        SECTOR 7-D [CANYON]
      </text>
    </g>
  );
};

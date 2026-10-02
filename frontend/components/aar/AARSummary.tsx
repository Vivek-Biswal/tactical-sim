import React from "react";
import { AARReportData } from "../../types/exercise";
import { Shield, BookOpen, AlertTriangle, CheckCircle, Award } from "lucide-react";

interface AARSummaryProps {
  aar: AARReportData;
  className?: string;
}

export const AARSummary: React.FC<AARSummaryProps> = ({ aar, className = "" }) => {
  return (
    <div className={`space-y-4 font-mono text-xs ${className}`}>
      {/* Exercise Overview Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-3 pb-2 border-b border-slate-800">
          <Shield className="w-4 h-4" />
          <span className="uppercase tracking-wider">EXERCISE OVERVIEW &amp; SESSION METRICS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">SCENARIO:</span>
            <span className="text-slate-200 font-bold text-sm">{aar.scenarioName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold block">PARTICIPATING UNIT:</span>
            <span className="text-slate-200 font-bold text-sm">{aar.teamName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold block">SIMULATION DURATION:</span>
            <span className="text-cyan-400 font-bold text-sm">{aar.stats.duration}</span>
          </div>
        </div>
      </div>

      {/* Analytical Findings */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3 pb-2 border-b border-slate-800">
          <BookOpen className="w-4 h-4" />
          <span className="uppercase tracking-wider">ANALYTICAL FINDINGS</span>
        </div>

        <ul className="space-y-2">
          {aar.analyticalFindings.map((finding, idx) => (
            <li
              key={idx}
              className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300 flex items-start space-x-2 leading-relaxed"
            >
              <span className="text-cyan-400 font-bold">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-3 pb-2 border-b border-slate-800">
          <CheckCircle className="w-4 h-4" />
          <span className="uppercase tracking-wider">DEGRADED C2 TRAINING RECOMMENDATIONS</span>
        </div>

        <ul className="space-y-2">
          {aar.recommendations.map((rec, idx) => (
            <li
              key={idx}
              className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 flex items-start space-x-2 leading-relaxed"
            >
              <span className="text-emerald-400 font-bold">{idx + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

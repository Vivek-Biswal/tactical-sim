import React from "react";
import { TraineePresence } from "../../types/exercise";
import { Users, User, Shield, CheckCircle } from "lucide-react";

interface TraineeStatusProps {
  trainees?: TraineePresence[];
  className?: string;
}

export const TraineeStatus: React.FC<TraineeStatusProps> = ({
  trainees = [],
  className = ""
}) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
        <div className="font-bold text-slate-200 flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>CONNECTED TRAINEES &amp; ROLES</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{trainees.length} ACTIVE</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {trainees.length === 0 ? (
          <div className="text-slate-500 italic py-2 text-center text-[11px]">
            No external trainees connected. (Running local commander session)
          </div>
        ) : (
          trainees.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80"
            >
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                  <User className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">{t.name}</span>
                  <span className="text-[10px] text-slate-500">ROLE: {t.role}</span>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                ONLINE
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

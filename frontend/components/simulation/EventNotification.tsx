import React, { useState, useEffect } from "react";
import { SimulationEventLog } from "../../types/exercise";
import { AlertTriangle, Radio, WifiOff, FileWarning, HelpCircle, X, ShieldAlert } from "lucide-react";

interface EventNotificationProps {
  latestEvent?: SimulationEventLog | null;
}

export const EventNotification: React.FC<EventNotificationProps> = ({ latestEvent }) => {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SimulationEventLog | null>(null);

  useEffect(() => {
    if (latestEvent && latestEvent.category !== "system" && latestEvent.id !== currentEvent?.id) {
      setCurrentEvent(latestEvent);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [latestEvent, currentEvent]);

  if (!visible || !currentEvent) return null;

  const getEventStyling = () => {
    switch (currentEvent.category) {
      case "comms":
      case "comms_degradation":
        return {
          icon: <WifiOff className="w-5 h-5 text-amber-400" />,
          border: "border-amber-500/70",
          bg: "bg-amber-950/90",
          text: "text-amber-200"
        };
      case "conflicting_report":
        return {
          icon: <HelpCircle className="w-5 h-5 text-yellow-400" />,
          border: "border-yellow-500/70",
          bg: "bg-yellow-950/90",
          text: "text-yellow-200"
        };
      case "map_status":
        return {
          icon: <FileWarning className="w-5 h-5 text-amber-400" />,
          border: "border-amber-500/70",
          bg: "bg-amber-950/90",
          text: "text-amber-200"
        };
      case "intel_update":
        return {
          icon: <ShieldAlert className="w-5 h-5 text-purple-400" />,
          border: "border-purple-500/70",
          bg: "bg-purple-950/90",
          text: "text-purple-200"
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-cyan-400" />,
          border: "border-cyan-500/70",
          bg: "bg-cyan-950/90",
          text: "text-cyan-200"
        };
    }
  };

  const style = getEventStyling();

  return (
    <div
      className={`fixed top-16 right-4 z-50 max-w-md p-3.5 rounded-lg border shadow-2xl backdrop-blur-md font-mono transition-all duration-300 animate-in slide-in-from-top ${style.bg} ${style.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-2.5">
          <div className="p-1 rounded bg-slate-900/60 mt-0.5">{style.icon}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-bold">{currentEvent.time}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {currentEvent.title}
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${style.text}`}>
              {currentEvent.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

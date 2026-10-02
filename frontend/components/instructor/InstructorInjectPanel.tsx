import React, { useState } from "react";
import { Zap, Send, Target, Eye, AlertTriangle, Shield, Flag, Database } from "lucide-react";

interface InstructorInjectPanelProps {
  onInject: (action: string, payload?: Record<string, unknown>) => void;
  className?: string;
}

type InjectType = "intel_report" | "move_unit" | "change_status" | "detect_contact" | "activate_contact" | "change_objective" | "decision_point";

export const InstructorInjectPanel: React.FC<InstructorInjectPanelProps> = ({
  onInject,
  className = ""
}) => {
  const [injectType, setInjectType] = useState<InjectType>("intel_report");
  
  // Generic payload states
  const [source, setSource] = useState("UAV");
  const [sector, setSector] = useState("Sector C");
  const [message, setMessage] = useState("Unknown activity detected");
  const [unitId, setUnitId] = useState("unit-alpha");
  const [status, setStatus] = useState("operational");
  const [contactId, setContactId] = useState("contact-1");
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [decisionTitle, setDecisionTitle] = useState("Commander Decision");
  const [decisionPrompt, setDecisionPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let payload: Record<string, unknown> = {};

    switch (injectType) {
      case "intel_report":
        // Intel report must flow through comms degradation in the engine
        payload = {
          source,
          sector,
          message,
          senderRole: "INTELLIGENCE"
        };
        break;
      case "move_unit":
        payload = { targetUnitId: unitId, sector };
        break;
      case "change_status":
        payload = { targetUnitId: unitId, status };
        break;
      case "detect_contact":
      case "activate_contact":
        payload = { targetContactId: contactId, sector };
        break;
      case "change_objective":
        payload = { title: objectiveTitle, description: message };
        break;
      case "decision_point":
        payload = {
          title: decisionTitle,
          prompt: decisionPrompt,
          options: [
            { id: "opt1", label: "Proceed", description: "Continue with current plan." },
            { id: "opt2", label: "Halt", description: "Hold position." }
          ]
        };
        break;
    }

    onInject(injectType, payload);
  };

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-lg p-4 font-mono text-xs ${className}`}>
      <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-4 border-b border-slate-800 pb-2">
        <Database className="w-4 h-4" />
        <span>CUSTOM EVENT INJECTION PANEL</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 font-bold mb-1">EVENT TYPE:</label>
          <select
            value={injectType}
            onChange={(e) => setInjectType(e.target.value as InjectType)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 outline-none focus:border-cyan-500 transition"
          >
            <option value="intel_report">Intel Report</option>
            <option value="move_unit">Move Unit</option>
            <option value="change_status">Change Unit Status</option>
            <option value="detect_contact">Detect Contact</option>
            <option value="activate_contact">Activate Contact</option>
            <option value="change_objective">Change Objective</option>
            <option value="decision_point">Create Decision Point</option>
          </select>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-3">
          {injectType === "intel_report" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">SOURCE:</label>
                  <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                    <option value="UAV">UAV</option>
                    <option value="SIGINT">SIGINT</option>
                    <option value="HUMINT">HUMINT</option>
                    <option value="SATELLITE">SATELLITE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">SECTOR:</label>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                    <option value="Sector A">Sector A</option>
                    <option value="Sector B">Sector B</option>
                    <option value="Sector C">Sector C</option>
                    <option value="Sector D">Sector D</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">MESSAGE:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 h-16 resize-none"
                />
              </div>
            </>
          )}

          {(injectType === "move_unit" || injectType === "change_status") && (
            <div>
              <label className="block text-slate-500 font-bold mb-1">UNIT ID:</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 mb-3">
                <option value="unit-alpha">Team Alpha (unit-alpha)</option>
                <option value="unit-bravo">Team Bravo (unit-bravo)</option>
              </select>

              {injectType === "move_unit" && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">NEW SECTOR:</label>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                    <option value="Sector A">Sector A</option>
                    <option value="Sector B">Sector B</option>
                    <option value="Sector C">Sector C</option>
                    <option value="Sector D">Sector D</option>
                  </select>
                </div>
              )}

              {injectType === "change_status" && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">NEW STATUS:</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                    <option value="operational">Operational</option>
                    <option value="moving">Moving</option>
                    <option value="engaged">Engaged</option>
                    <option value="pinned">Pinned</option>
                    <option value="destroyed">Destroyed</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {(injectType === "detect_contact" || injectType === "activate_contact") && (
            <div>
              <label className="block text-slate-500 font-bold mb-1">CONTACT ID:</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 mb-3">
                <option value="contact-1">Contact 1</option>
                <option value="contact-2">Contact 2</option>
                <option value="contact-3">Contact 3</option>
              </select>
              
              <label className="block text-slate-500 font-bold mb-1">SECTOR:</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                <option value="Sector A">Sector A</option>
                <option value="Sector B">Sector B</option>
                <option value="Sector C">Sector C</option>
                <option value="Sector D">Sector D</option>
              </select>
            </div>
          )}

          {injectType === "change_objective" && (
             <div>
               <label className="block text-slate-500 font-bold mb-1">NEW OBJECTIVE:</label>
               <input
                 type="text"
                 value={objectiveTitle}
                 onChange={(e) => setObjectiveTitle(e.target.value)}
                 placeholder="E.g., Secure Northern Pass"
                 className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 mb-3"
               />
               <label className="block text-slate-500 font-bold mb-1">DETAILS:</label>
               <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 h-16 resize-none"
                />
             </div>
          )}

          {injectType === "decision_point" && (
             <div>
               <label className="block text-slate-500 font-bold mb-1">DECISION TITLE:</label>
               <input
                 type="text"
                 value={decisionTitle}
                 onChange={(e) => setDecisionTitle(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 mb-3"
               />
               <label className="block text-slate-500 font-bold mb-1">SITUATION PROMPT:</label>
               <textarea
                  value={decisionPrompt}
                  onChange={(e) => setDecisionPrompt(e.target.value)}
                  placeholder="Describe the situation the commander must decide on..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 h-16 resize-none"
                />
             </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 text-cyan-300 font-bold py-2.5 rounded transition"
        >
          <Send className="w-4 h-4" />
          <span>SEND INJECT TO ENGINE</span>
        </button>
      </form>
    </div>
  );
};

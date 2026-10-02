"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Shield, Clock, AlertTriangle, Radio } from "lucide-react";
import { ScenarioEvent } from "@/types/scenario";

export default function CreateScenarioPage() {
  const router = useRouter();
  const [name, setName] = useState("Operation Iron Phantom");
  const [codeName, setCodeName] = useState("PHANTOM-99");
  const [description, setDescription] = useState("Reconnaissance patrol under contested electronic counter-measures and deceptive communications.");
  const [duration, setDuration] = useState(120);
  const [operationalArea, setOperationalArea] = useState("Sector 9 - Highland Defile");

  const [events, setEvents] = useState<Array<{ time: number; type: string; title: string; description: string }>>([
    { time: 0, type: "comms_degradation", title: "Exercise Baseline", description: "Units establish communication net." },
    { time: 25, type: "comms_degradation", title: "Radio Latency (+10s)", description: "Atmospheric interference degrades tactical VHF voice/data link." },
    { time: 50, type: "conflicting_report", title: "Contradictory Intel Feeds", description: "Scout sightings clash with drone acoustic intercept." },
    { time: 70, type: "map_status", title: "COP GPS Link Denied", description: "Common Operating Picture telemetry frozen." },
    { time: 90, type: "decision_point", title: "Commander Decision Point", description: "Mandatory tactical order required under total uncertainty." }
  ]);

  const handleAddEvent = () => {
    setEvents([
      ...events,
      { time: 100, type: "intel_update", title: "Emergency Courier Relay", description: "Hardened courier arrives with critical ground confirmation." }
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Custom Scenario "${name}" (${codeName}) saved successfully!`);
    router.push("/instructor/scenarios");
  };

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/instructor/scenarios" className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Scenarios Library</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm font-bold text-slate-200">TACTICAL SCENARIO BUILDER</span>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        >
          <Save className="w-3.5 h-3.5" />
          <span>SAVE SCENARIO</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              GENERAL SCENARIO METADATA
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">SCENARIO TITLE:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CALLSIGN / CODE:</label>
                <input
                  type="text"
                  required
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">OPERATIONAL AREA:</label>
                <input
                  type="text"
                  required
                  value={operationalArea}
                  onChange={(e) => setOperationalArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">DURATION (SECONDS):</label>
                <input
                  type="number"
                  required
                  min={30}
                  max={3600}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">MISSION NARRATIVE:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Timeline Events Editor */}
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                DEGRADATION INJECT TIMELINE ({events.length} EVENTS)
              </h2>
              <button
                type="button"
                onClick={handleAddEvent}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD EVENT</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.map((evt, idx) => (
                <div key={idx} className="p-3 rounded bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
                  <div className="w-20">
                    <span className="text-[10px] text-slate-500 font-bold block">TRIGGER (SEC):</span>
                    <input
                      type="number"
                      value={evt.time}
                      onChange={(e) => {
                        const copy = [...events];
                        copy[idx].time = Number(e.target.value);
                        setEvents(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-bold"
                    />
                  </div>

                  <div className="w-40">
                    <span className="text-[10px] text-slate-500 font-bold block">CATEGORY:</span>
                    <select
                      value={evt.type}
                      onChange={(e) => {
                        const copy = [...events];
                        copy[idx].type = e.target.value;
                        setEvents(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="comms_degradation">Radio Degradation</option>
                      <option value="conflicting_report">Conflicting Report</option>
                      <option value="map_status">Map Telemetry</option>
                      <option value="intel_update">Intelligence Update</option>
                      <option value="decision_point">Decision Point</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 font-bold block">TITLE &amp; DESCRIPTION:</span>
                    <input
                      type="text"
                      value={evt.title}
                      onChange={(e) => {
                        const copy = [...events];
                        copy[idx].title = e.target.value;
                        setEvents(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold mb-1"
                    />
                    <input
                      type="text"
                      value={evt.description}
                      onChange={(e) => {
                        const copy = [...events];
                        copy[idx].description = e.target.value;
                        setEvents(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition mt-4"
                    title="Remove event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

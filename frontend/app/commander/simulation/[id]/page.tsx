"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useSimulationWebSocket } from "@/lib/websocket";
import { SimulationHeader } from "@/components/simulation/SimulationHeader";
import { TacticalMap } from "@/components/tactical/TacticalMap";
import { RadioPanel } from "@/components/communication/RadioPanel";
import { SituationPanel } from "@/components/simulation/SituationPanel";
import { DecisionPanel } from "@/components/simulation/DecisionPanel";
import { DecisionHistory } from "@/components/simulation/DecisionHistory";
import { EventNotification } from "@/components/simulation/EventNotification";
import { ScenarioControlBar } from "@/components/simulation/ScenarioControlBar";
import { IntelFeed } from "@/components/simulation/IntelFeed";

export default function CommanderSimulationScreen({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const exerciseId = unwrappedParams.id;
  const router = useRouter();

  const {
    state,
    isConnected,
    sendRadioMessage,
    submitDecision,
    sendExerciseControl
  } = useSimulationWebSocket({
    exerciseId,
    role: "COMMANDER",
    name: "Commander 1"
  });

  const latestEvent = state.eventLog.length > 0
    ? state.eventLog[state.eventLog.length - 1]
    : null;

  const handleEndExercise = () => {
    sendExerciseControl("end");
    router.push(`/aar/${exerciseId}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#070a11] text-slate-100 font-mono flex flex-col select-none">
      {/* HUD Header */}
      <SimulationHeader
        scenarioName={state.scenarioName}
        scenarioCode={state.scenarioCode}
        formattedTime={state.formattedTime}
        progressPercent={state.progressPercent}
        commsStatus={state.commsStatus}
        mapStatus={state.mapStatus}
        radioDelaySeconds={state.radioDelaySeconds}
        isConnected={isConnected}
        status={state.status}
        isDemo={state.isDemo}
        onControl={sendExerciseControl}
        onEndExercise={handleEndExercise}
      />

      {/* Phase 3: Scenario Control Bar */}
      <div className="px-2.5 pt-2.5">
        <ScenarioControlBar
          status={state.status}
          formattedTime={state.formattedTime}
          progressPercent={state.progressPercent}
          onControl={sendExerciseControl}
        />
      </div>

      {/* Floating Scenario Event Notification */}
      <EventNotification latestEvent={latestEvent} />

      {/* Main Tactical Workspace Split */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-2.5 gap-2.5 overflow-hidden">
        {/* Left & Center: Tactical Map (Takes primary focus) */}
        <div className="flex-1 flex flex-col min-h-0 rounded-lg overflow-hidden border border-slate-800 shadow-md">
          <TacticalMap
            units={state.units}
            activityMarkers={state.activityMarkers}
            mapStatus={state.mapStatus}
            mapLastUpdated={state.mapLastUpdated}
            className="flex-1"
          />
        </div>

        {/* Right: Intel Feed + Situation Panel */}
        <div className="w-full lg:w-96 flex flex-col shrink-0 min-h-0 gap-2.5">
          {/* Phase 3: Intel Feed */}
          <IntelFeed
            eventLog={state.eventLog}
            className="flex-1 min-h-0"
          />

          {/* Situation Panel */}
          <SituationPanel
            availableInformation={state.availableInformation}
            unavailableInformation={state.unavailableInformation}
            units={state.units}
            eventLog={state.eventLog}
            className="flex-1 min-h-0"
          />
        </div>
      </div>

      {/* Bottom Area: Radio Communication + Decision Controls */}
      <div className="p-2.5 pt-0 shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 max-h-[300px]">
        {/* Tactical Radio Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <RadioPanel
            messages={state.messages}
            pendingMessages={state.pendingMessages}
            commsStatus={state.commsStatus}
            radioDelaySeconds={state.radioDelaySeconds}
            userRole="COMMANDER"
            userName="Commander 1"
            onSendMessage={sendRadioMessage}
          />
        </div>

        {/* Tactical Decision System (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-end space-y-2 overflow-y-auto">
          {state.decisions && state.decisions.length > 0 && (
            <DecisionHistory decisions={state.decisions} />
          )}
          {state.activeDecisionPoint && (
            <DecisionPanel
              decisionPoint={state.activeDecisionPoint}
              commsStatus={state.commsStatus}
              onSubmit={(actionId, label, rationale, confidence) => 
                submitDecision(label, rationale, confidence, actionId)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

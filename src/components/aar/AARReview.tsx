"use client";
import { useMemo, useRef, useState } from "react";
import type { AARReportData } from "@/simulation/types/exercise";
import { analyzeAAR, decisionSecond, displayValue, downloadReview, formatAARTime, wallTime } from "@/simulation/lib/aar";
import { printReview } from "@/simulation/lib/aarPrint";
import { ScenarioTimeline } from "./ScenarioTimeline";
import { DecisionAnalysis } from "./DecisionAnalysis";
import { CommunicationAnalysis } from "./CommunicationAnalysis";
import { TeamAnalysis } from "./TeamAnalysis";
import styles from "./review.module.css";

export function AARReview({ report, role = "Commander", local = false }: { report: AARReportData; role?: string; local?: boolean }) {
  const analysis = useMemo(() => analyzeAAR(report), [report]);
  const [selectedId, setSelectedId] = useState<string | undefined>(report.decisions[0]?.id);
  const [contextSecond, setContextSecond] = useState<number | null>(null);
  const [printError, setPrintError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const selectedDecision = report.decisions.find(decision => decision.id === selectedId) ?? report.decisions[0];
  function selectDecision(id: string) { setSelectedId(id); requestAnimationFrame(() => headingRef.current?.focus()); }
  const experience = [
    ...analysis.radio.map((interval, index) => ({ id: `radio-${index}`, second: interval.second, title: `Radio ${displayValue(interval.state)}` })),
    ...analysis.map.map((interval, index) => ({ id: `map-${index}`, second: interval.second, title: `Map ${displayValue(interval.state)}` })),
    ...analysis.timeline.filter(event => event.category === "decision" || (event.category === "intelligence" && event.messageId && /received|delivered/i.test(event.title))),
  ].sort((a, b) => a.second - b.second).slice(-12);
  return <div className={styles.root} data-aar-review>
    <header className={styles.overview}>
      <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>After-action review / {local ? "Local practice record" : "Shared exercise record"}</span><h1>{report.scenarioName}</h1><p className={styles.muted}>{report.teamName} · {report.exerciseId}{report.trainingArea ? ` · ${report.trainingArea.name}` : ""}</p></div><span className={styles.status} data-state={report.isFinal ? "normal" : "delayed"}>{report.isFinal ? "Final record" : "Live preview"}</span></div>
      <dl className={styles.facts}><div><dt>Review role</dt><dd>{role}{report.reviewScope ? ` · ${displayValue(report.reviewScope)}` : ""}</dd></div><div><dt>Scenario</dt><dd>{report.scenarioCode || report.scenarioName}</dd></div><div><dt>Started</dt><dd>{wallTime(report.startedAt)}</dd></div><div><dt>Ended</dt><dd>{wallTime(report.completedAt)}</dd></div><div><dt>Simulation duration</dt><dd>{formatAARTime(report.durationSeconds, true)}</dd></div><div><dt>Exercise status</dt><dd>{report.status ? displayValue(report.status) : report.isFinal ? "Completed" : "In progress"}</dd></div></dl>
      <div className={styles.metrics}>{[["Decisions", report.decisions.length], ["Radio disruptions", analysis.radio.length ? analysis.disruptions : "Not available"], ["Delayed messages", report.stats.messagesDelayed], ["Dropped messages", report.stats.messagesDropped], ["Conflicting reports", analysis.conflicts], ["Received intel updates", analysis.informationUpdates]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className={styles.controls}><button className={styles.button} onClick={() => downloadReview(report, "json")}>Export complete JSON</button><button className={styles.button} onClick={() => downloadReview(report, "csv")}>Export decisions CSV</button><button className={styles.button} onClick={() => setPrintError(printReview(report) ? "" : "Allow the review pop-up in your browser to print or save a PDF.")}>Print / Save PDF</button></div>
      {printError && <p role="alert" className={styles.amber}>{printError}</p>}
      <p className={styles.footnote}>{report.isFinal ? "Final debrief includes exercise truth, including undelivered attempts. Decision snapshots retain only information available at submission." : "This record stops at the current simulation time. It is not a final assessment."} No tactical correctness or performance score is assigned.</p>
    </header>
    <div className={styles.twoColumns}>
      <div ref={timelineRef}><ScenarioTimeline events={analysis.timeline} selectedId={selectedDecision?.id} onSelect={selectDecision} contextSecond={contextSecond} onClearContext={() => setContextSecond(null)} /></div>
      <div><div className={styles.controls}><label className={styles.selector}>Inspect decision<select aria-label="Inspect decision" disabled={!report.decisions.length} value={selectedDecision?.id ?? ""} onChange={event => selectDecision(event.target.value)}>{!report.decisions.length && <option value="">No decisions</option>}{report.decisions.map((decision, index) => <option key={decision.id} value={decision.id}>#{index + 1} · {formatAARTime(decisionSecond(decision), true)} · {decision.traineeId}</option>)}</select></label></div><DecisionAnalysis report={report} decision={selectedDecision} headingRef={headingRef} onContext={second => { setContextSecond(second); timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} /></div>
    </div>
    <CommunicationAnalysis report={report} analysis={analysis} />
    <section className={styles.panel}><div className={styles.sectionTitle}><div><span className={styles.eyebrow}>Quick reconstruction</span><h2>What the trainee experienced</h2></div></div><ol className={styles.experience}>{experience.map(event => <li key={event.id}><time className={styles.clock}>{formatAARTime(event.second)}</time><span>{event.title}</span></li>)}</ol>{!experience.length && <p className={styles.empty}>No received intelligence, degradation or decision events recorded yet.</p>}<p className={styles.footnote}>Latest 12 recorded feed changes, received intelligence and decision events. Instructor-only truth and undelivered reports are excluded from this reconstruction.</p></section>
    <TeamAnalysis report={report} selectedDecision={selectedDecision} />
    <section className={styles.panel}><div className={styles.sectionTitle}><div><span className={styles.eyebrow}>05 / Factual observations</span><h2>Review summary</h2></div></div><dl className={styles.facts}><div><dt>Average response latency</dt><dd>{analysis.averageLatency === null ? "Not available" : `${analysis.averageLatency.toFixed(1)}s · ${analysis.measuredResponses}/${report.decisions.length} decisions timed`}</dd></div><div><dt>Radio available (not offline)</dt><dd>{analysis.radioAvailableSeconds === null ? "Not available" : `${analysis.radioAvailableSeconds.toFixed(1)}s of ${report.durationSeconds.toFixed(1)}s`}</dd></div><div><dt>Information requests</dt><dd>Not available</dd></div><div><dt>Participants / roles</dt><dd>{report.participants?.length ? report.participants.map(p => `${p.name} (${displayValue(p.role)})`).join("; ") : local ? "Local practice · simulated sources" : "Not available"}</dd></div></dl><p className={styles.text}>{analysis.summary}</p><details className={styles.details}><summary>Instructor discussion prompts</summary><ul className={styles.prompts}><li>Which recorded reports support each decision’s rationale?</li><li>What assumptions were made while radio or map information was degraded?</li><li>Did information arriving later change the team’s understanding?</li></ul></details></section>
  </div>;
}

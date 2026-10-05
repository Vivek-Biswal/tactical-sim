"use client";
import type { RefObject } from "react";
import type { AARReportData } from "@/simulation/types/exercise";
import type { DecisionRecord } from "@/simulation/types/decision";
import { allMessages, displayValue, formatAARTime, messageSecond, reportAvailability, responseTimes } from "@/simulation/lib/aar";
import styles from "./review.module.css";

export function DecisionAnalysis({ report, decision, headingRef, onContext }: { report: AARReportData; decision?: DecisionRecord; headingRef: RefObject<HTMLHeadingElement | null>; onContext: (second: number) => void }) {
  const times = decision ? responseTimes(report, decision) : null;
  const reports = decision ? allMessages(report).filter(message => reportAvailability(report, message, decision) === "available") : [];
  return <section className={styles.panel} aria-label="Individual decision analysis">
    <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>02 / Individual analysis</span><h2 ref={headingRef} tabIndex={-1}>Decision {decision ? `#${report.decisions.findIndex(d => d.id === decision.id) + 1}` : "analysis"}</h2></div>{decision && times?.submitted != null && <button className={styles.button} onClick={() => onContext(times.submitted!)}>Surrounding events</button>}</div>
    {!decision || !times ? <p className={styles.empty}>No decisions recorded. Submitted actions and their rationale will appear here.</p> : <>
      <p className={styles.muted}>{decision.traineeId} · {formatAARTime(times.submitted, true)} · confidence: <strong>{displayValue(decision.confidence)}</strong></p>
      <h3 className={styles.action}>{decision.selectedActionLabel || decision.decision || "Not available"}</h3>
      <div className={styles.contextChain} aria-label="Information to decision context"><span>{reports.length} available transmissions</span><span aria-hidden="true">↓</span><span>Radio {displayValue(decision.communicationState)} · map {displayValue(decision.mapStatus)}</span><span aria-hidden="true">↓</span><span>{decision.selectedActionLabel || "Recorded action"}</span><span aria-hidden="true">↓</span><blockquote>{decision.rationale?.trim() || "Rationale: Not available"}</blockquote></div>
      <dl className={styles.facts}><div><dt>Linked event time</dt><dd>{formatAARTime(times.event, true)}</dd></div><div><dt>Decision required</dt><dd>{formatAARTime(times.required, true)}</dd></div><div><dt>Decision submitted</dt><dd>{formatAARTime(times.submitted, true)}</dd></div><div><dt>Response latency</dt><dd>{times.latency === null ? "Not available" : `${times.latency.toFixed(1)} seconds`}</dd></div><div><dt>Radio delay at decision</dt><dd>{decision.informationSnapshot?.radioDelaySeconds == null ? "Not available" : `${decision.informationSnapshot.radioDelaySeconds}s`}</dd></div><div><dt>Map last updated</dt><dd>{formatAARTime(decision.informationSnapshot?.mapSnapshotSecond, true)}</dd></div><div><dt>Information reliability</dt><dd>{decision.informationSnapshot?.reliability === "not_assessed" ? "Not assessed" : displayValue(decision.informationSnapshot?.reliability)}</dd></div></dl>
      <div className={styles.informationGrid}><InformationList title="Available information" items={decision.availableInformation} tone="available" /><InformationList title="Unavailable / degraded" items={decision.unavailableInformation} tone="unavailable" /></div>
      <details className={styles.details}><summary>Reports available at this decision ({reports.length})</summary>{reports.length ? reports.map(message => <article key={message.id} className={styles.report}><strong>{message.sender} · received {formatAARTime(messageSecond(message, true), true)}</strong><p>{message.content}</p>{message.isConflicting && <span className={styles.amber}>Marked conflicting; confirmation {message.confirmed === true ? "recorded" : "not recorded"}.</span>}</article>) : <p className={styles.muted}>No transmissions can be confirmed available from the recorded snapshot and delivery timestamps.</p>}</details>
      <p className={styles.footnote}>The snapshot records what was available at submission. Undelivered and later reports are excluded. Response times use simulation time; missing timestamps remain “Not available.”</p>
    </>}
  </section>;
}

function InformationList({ title, items, tone }: { title: string; items?: string[]; tone: "available" | "unavailable" }) {
  return <div className={styles.information} data-tone={tone}><h3>{title}</h3>{items?.length ? <ul>{items.map((info, index) => <li key={index}>{info}</li>)}</ul> : <p className={styles.muted}>{items ? "None recorded." : "Not available"}</p>}</div>;
}

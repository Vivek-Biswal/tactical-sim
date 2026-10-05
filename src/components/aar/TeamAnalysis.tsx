"use client";
import { useState } from "react";
import type { AARReportData } from "@/simulation/types/exercise";
import type { DecisionRecord } from "@/simulation/types/decision";
import { allMessages, displayValue, formatAARTime, messageSecond, reportAvailability } from "@/simulation/lib/aar";
import styles from "./review.module.css";

export function TeamAnalysis({ report, selectedDecision }: { report: AARReportData; selectedDecision?: DecisionRecord }) {
  const messages = allMessages(report);
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(messages.length / 30) - 1);
  const currentPage = Math.min(page, lastPage);
  const senders = [...new Set(messages.map(message => message.sender))];
  return <section className={styles.panel}>
    <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>04 / Team coordination</span><h2>Reports & delivery record</h2></div></div>
    <p className={styles.muted}>Compare generation with receipt. Final debriefs include undelivered attempts; their contents were unavailable during the exercise. Availability refers to the selected decision.</p>
    <div className={styles.tableScroll}><table className={styles.table}><caption>Recorded communication by source</caption><thead><tr><th>Source</th><th>Sent</th><th>Delivered</th><th>Delayed</th><th>Dropped</th><th>Reports</th><th>Conflicting</th><th>Information requests</th></tr></thead><tbody>{senders.map(sender => {
      const sent = messages.filter(message => message.sender === sender);
      return <tr key={sender}><th scope="row">{sender}</th><td>{sent.length}</td><td>{sent.filter(m => m.deliveryStatus === "DELIVERED").length}</td><td>{sent.filter(m => m.wasDelayed || m.deliveryStatus === "DELAYED" || (messageSecond(m, true) ?? 0) > (messageSecond(m) ?? Infinity)).length}</td><td>{sent.filter(m => m.deliveryStatus === "DROPPED").length}</td><td>{sent.filter(m => /REPORT/.test(m.messageType ?? "")).length}</td><td>{sent.filter(m => m.isConflicting).length}</td><td>Not available</td></tr>;
    })}</tbody></table></div>
    {!senders.length && <p className={styles.empty}>No transmissions recorded.</p>}
    <div className={styles.reportList}>{messages.slice(currentPage * 30, (currentPage + 1) * 30).map(message => {
      const generated = messageSecond(message);
      const delivered = messageSecond(message, true);
      const availability = selectedDecision ? reportAvailability(report, message, selectedDecision) : null;
      const conflicts = message.conflictGroupId ? messages.filter(m => m.id !== message.id && m.conflictGroupId === message.conflictGroupId) : [];
      return <details key={message.id} id={`report-${message.id}`} className={styles.report}>
        <summary><span className={styles.clock}>{formatAARTime(generated, true)}</span> {message.sender} → {message.recipient || "Training net (recipient not recorded)"}<span data-state={message.deliveryStatus.toLowerCase()} className={styles.status}>{message.deliveryStatus}</span></summary>
        <p className={styles.text}>{message.content}</p>
        <dl className={styles.facts}><div><dt>Generated</dt><dd>{formatAARTime(generated, true)}</dd></div><div><dt>Delivered</dt><dd>{message.deliveryStatus === "DELIVERED" ? formatAARTime(delivered, true) : "Not delivered"}</dd></div><div><dt>Delivery latency</dt><dd>{delivered !== null && generated !== null && message.deliveryStatus === "DELIVERED" ? `${Math.max(0, delivered - generated).toFixed(1)}s` : "Not available"}</dd></div><div><dt>Reliability</dt><dd>{message.isConflicting ? "Conflicting" : displayValue(message.reliability)}</dd></div><div><dt>Confirmation</dt><dd>{message.confirmed === true ? "Confirmed" : message.confirmed === false ? "Unconfirmed" : "Not recorded"}</dd></div><div><dt>Channel</dt><dd>{displayValue(message.channel)}</dd></div><div><dt>Available at selected decision</dt><dd>{availability === "available" ? "Yes · received before submission" : availability === "unavailable" ? "No · absent from snapshot or not received" : "Not available"}</dd></div></dl>
        {message.dropReason && <p className={styles.red}>Drop reason: {message.dropReason}</p>}
        {message.isConflicting && <p className={styles.amber}>Conflicts with: {conflicts.length ? conflicts.map(m => `${m.sender} (${m.id})`).join("; ") : "Linked report not recorded."}</p>}
      </details>;
    })}</div>
    {lastPage > 0 && <div className={styles.controls}><button className={styles.button} disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous 30</button><span className={styles.muted}>Page {currentPage + 1} of {lastPage + 1}</span><button className={styles.button} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next 30</button></div>}
    <p className={styles.footnote}>“Delivered” records net receipt, not proof that a person read a message. Requests have no structured event type in this simulation and are not inferred from text. Local practice uses simulated sources, rather than connected multiplayer users.</p>
  </section>;
}

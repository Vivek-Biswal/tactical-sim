"use client";
import { useState } from "react";
import { formatAARTime, type ReviewEvent, type TimelineCategory } from "@/simulation/lib/aar";
import styles from "./review.module.css";

const filters: [TimelineCategory | "all", string][] = [["all", "All events"], ["decision", "Decisions"], ["communication", "Communication"], ["intelligence", "Intelligence"], ["team", "Team events"], ["instructor", "Instructor"], ["scenario", "Scenario"]];

export function ScenarioTimeline({ events, selectedId, onSelect, contextSecond, onClearContext }: { events: ReviewEvent[]; selectedId?: string; onSelect: (id: string) => void; contextSecond: number | null; onClearContext: () => void }) {
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");
  const [page, setPage] = useState(0);
  const filtered = events.filter(event => (filter === "all" || event.category === filter || (filter === "communication" && (event.payload?.commsStatus || event.payload?.radioStatus || event.payload?.mapStatus))) && (contextSecond === null || Math.abs(event.second - contextSecond) <= 20));
  const lastPage = Math.max(0, Math.ceil(filtered.length / 50) - 1);
  const currentPage = Math.min(page, lastPage);
  return <section className={styles.panel} aria-label="Chronological decision timeline">
    <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>01 / Exercise reconstruction</span><h2>Decision timeline</h2></div><span className={styles.muted}>{filtered.length} events · simulation clock</span></div>
    <div className={styles.controls} role="group" aria-label="Filter timeline">{filters.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(0); }} className={filter === value ? styles.activeButton : styles.button}>{label}</button>)}</div>
    {contextSecond !== null && <div className={styles.notice}>Events within 20 seconds of {formatAARTime(contextSecond, true)}. <button className={styles.button} onClick={() => { onClearContext(); setFilter("all"); setPage(0); }}>Show full timeline</button></div>}
    <ol className={styles.timeline}>{filtered.slice(currentPage * 50, (currentPage + 1) * 50).map(event => <li key={event.id} data-category={event.category} className={styles.timelineEvent}>
      <time className={styles.clock}>{formatAARTime(event.second, true)}</time><div className={styles.eventBody}>
        <span className={styles.tag}>{event.category}</span>
        {event.decisionId ? <button aria-pressed={selectedId === event.decisionId} className={styles.decisionLink} onClick={() => onSelect(event.decisionId!)}>{event.title}<span aria-hidden="true"> →</span></button> : <details><summary>{event.title}</summary><p className={styles.text}>{event.description || "No additional detail recorded."}</p>{event.payload && <dl className={styles.facts}>{Object.entries(event.payload).filter(([, value]) => typeof value === "string" || typeof value === "number").slice(0, 8).map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{String(value)}</dd></div>)}</dl>}</details>}
        {event.decisionId && <p className={styles.muted}>Inspect the action, rationale and information snapshot.</p>}
      </div>
    </li>)}</ol>
    {!filtered.length && <p className={styles.empty}>No recorded events match this view.</p>}
    {lastPage > 0 && <div className={styles.controls}><button className={styles.button} disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous 50</button><span className={styles.muted}>Page {currentPage + 1} of {lastPage + 1}</span><button className={styles.button} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next 50</button></div>}
  </section>;
}

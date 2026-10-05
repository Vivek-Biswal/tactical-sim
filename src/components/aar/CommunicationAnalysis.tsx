import type { AARReportData } from "@/simulation/types/exercise";
import { analyzeAAR, displayValue, formatAARTime, type StateInterval } from "@/simulation/lib/aar";
import styles from "./review.module.css";

export function CommunicationAnalysis({ report, analysis }: { report: AARReportData; analysis: ReturnType<typeof analyzeAAR> }) {
  return <section className={styles.panel}>
    <div className={styles.sectionTitle}><div><span className={styles.eyebrow}>03 / Degradation analysis</span><h2>Communication & map feeds</h2></div></div>
    <p className={styles.muted}>{report.stats.messagesDelivered} delivered · {report.stats.messagesDelayed} experienced delay · {report.stats.messagesDropped} dropped · {report.stats.messagesPending ?? report.pendingMessages.length} pending. Delayed counts include messages later delivered.</p>
    <StateTransitions label="Radio state" intervals={analysis.radio} />
    <StateTransitions label="Map state" intervals={analysis.map} />
    <p className={styles.footnote}>Intervals end at the next recorded transition or the review cutoff. Recovery is measured from the start of a continuous disruption. Conflicting intelligence is assessed separately from radio availability.</p>
  </section>;
}

function StateTransitions({ label, intervals }: { label: string; intervals: StateInterval[] }) {
  return <div className={styles.transitions}><h3>{label}</h3>{intervals.length ? <ol>{intervals.map((interval, index) => <li key={`${interval.second}-${index}`} data-state={interval.state}><span className={styles.clock}>{formatAARTime(interval.second, true)}</span><strong>{displayValue(interval.state)}</strong><span>{interval.duration.toFixed(1)}s in state{interval.delay != null ? ` · configured delay ${interval.delay}s` : ""}</span>{interval.recovery != null && <span className={styles.green}>Recovered after {interval.recovery.toFixed(1)}s</span>}</li>)}</ol> : <p className={styles.muted}>State transition timestamps: Not available.</p>}</div>;
}

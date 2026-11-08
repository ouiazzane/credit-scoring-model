import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, History as HistoryIcon, Trash2 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import type { Evaluation } from "../types";

interface Props { history: Evaluation[]; setHistory: (history: Evaluation[]) => void; }

export function History({ history, setHistory }: Props) {
  const [sortKey, setSortKey] = useState<"date" | "probability">("date");
  const [ascending, setAscending] = useState(false);
  const ordered = useMemo(() => [...history].sort((a, b) => {
    const comparison = sortKey === "date" ? a.date.localeCompare(b.date) : a.probability - b.probability;
    return ascending ? comparison : -comparison;
  }), [history, sortKey, ascending]);

  const toggleSort = (key: "date" | "probability") => {
    if (sortKey === key) setAscending(!ascending);
    else { setSortKey(key); setAscending(false); }
  };
  const exportCsv = () => {
    const columns = ["Date", "Age", "Monthly income", "Debt ratio", "Credit utilization", "Probability", "Decision", "Risk level"];
    const rows = ordered.map(({ date, client, probability, decision, riskLevel }) => [
      new Date(date).toLocaleString(), client.age, client.MonthlyIncome ?? "Unknown", client.DebtRatio,
      client.RevolvingUtilizationOfUnsecuredLines, `${(probability * 100).toFixed(2)}%`, decision, riskLevel,
    ]);
    const csv = [columns, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "credit-score-evaluations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-grid">
      <div className="page-intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> RECENT ACTIVITY</p><h1>Evaluation history</h1><p className="page-subtitle">Your last 20 evaluations, stored locally in this browser.</p></div><div className="history-actions"><span className="count-pill">{history.length} / 20 entries</span><button className="secondary-button" disabled={!history.length} onClick={exportCsv}><Download size={16} /> Export CSV</button></div></div>
      <GlassCard className="history-card">
        {history.length ? <div className="table-scroll"><table><thead><tr><th><button onClick={() => toggleSort("date")}>Date {sortKey === "date" && (ascending ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th><th>Client snapshot</th><th><button onClick={() => toggleSort("probability")}>Probability {sortKey === "probability" && (ascending ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th><th>Decision</th><th aria-label="Actions" /></tr></thead><tbody>{ordered.map((entry) => <tr key={entry.id}><td className="date-cell">{new Date(entry.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td><td><div className="snapshot-cell"><span>Age {entry.client.age}</span><span>Debt {entry.client.DebtRatio.toFixed(2)}</span><span>Util. {(entry.client.RevolvingUtilizationOfUnsecuredLines * 100).toFixed(0)}%</span></div></td><td><strong className="probability-cell">{(entry.probability * 100).toFixed(1)}%</strong></td><td><span className={`table-badge ${entry.decision === "Low risk" ? "table-low" : "table-high"}`}>{entry.decision}</span></td><td><button className="icon-button delete-button" aria-label={`Delete evaluation from ${new Date(entry.date).toLocaleString()}`} onClick={() => setHistory(history.filter((item) => item.id !== entry.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
          : <div className="history-empty"><div className="empty-gauge-ring"><HistoryIcon size={24} /></div><h2>No evaluations yet</h2><p>Once you score a client, your recent evaluations will appear here.</p></div>}
      </GlassCard>
      <p className="history-privacy">Your evaluation history stays in local browser storage and is not sent to a server.</p>
    </div>
  );
}

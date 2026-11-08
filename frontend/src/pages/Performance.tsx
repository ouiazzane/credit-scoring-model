import { useEffect, useState } from "react";
import { Activity, BarChart3, Crosshair, Gauge, Info, Target, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { Skeleton } from "../components/Skeleton";
import { CHARTS } from "../lib/constants";
import type { ComparisonRow, ImportanceRow, Metrics } from "../types";

const colors = ["#7d7bff", "#35c8b0", "#f2ae54", "#65a8f4"];
const metricKeys = ["Precision", "Recall", "F1", "ROC-AUC"] as const;

export function Performance({ notify }: { notify: (message: string, type: "success" | "error") => void }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [importance, setImportance] = useState<ImportanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.metrics(), api.comparison(), api.featureImportance()])
      .then(([metricData, comparisonData, importanceData]) => {
        if (!active) return;
        setMetrics(metricData);
        setComparison(comparisonData);
        setImportance(importanceData.slice(0, 10));
      })
      .catch((reason: unknown) => notify(reason instanceof Error ? reason.message : "Could not load model performance.", "error"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notify]);

  return (
    <div className="page-grid">
      <div className="page-intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> MODEL INSIGHTS</p><h1>Model performance</h1><p className="page-subtitle">A transparent view of the model metrics and evaluation results.</p></div><div className="model-chip"><span className="status-dot" /> {metrics?.model ?? "Model"} metrics</div></div>
      {loading || !metrics ? <div className="metrics-skeleton">{[1, 2, 3, 4].map((key) => <Skeleton className="metric-skeleton" key={key} />)}</div> : (
        <div className="metric-grid">
          <MetricCard label="Precision" value={metrics.precision} icon={Target} hint="Share of flagged clients who defaulted" />
          <MetricCard label="Recall" value={metrics.recall} icon={Crosshair} hint="Share of defaulters correctly identified" />
          <MetricCard label="F1 score" value={metrics.f1} icon={Gauge} hint="Balance of precision and recall" />
          <MetricCard label="ROC-AUC" value={metrics.roc_auc} icon={Activity} hint="Ranking ability across thresholds" />
        </div>
      )}
      <div className="chart-grid">
        <GlassCard className="chart-card"><div className="card-title-row"><div><h2>Model comparison</h2><p>Evaluation scores across four metrics</p></div><BarChart3 size={19} className="muted-icon" /></div>
          {loading ? <Skeleton className="chart-skeleton" /> : <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ top: 12, right: 4, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="Model" interval={0} minTickGap={0} tick={{ fill: "var(--muted)", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 1]} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "var(--tooltip)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" }} /><Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />{metricKeys.map((key, index) => <Bar key={key} dataKey={key} fill={colors[index]} radius={[4, 4, 0, 0]} maxBarSize={24} />)}</BarChart></ResponsiveContainer></div>}
        </GlassCard>
        <GlassCard className="chart-card"><div className="card-title-row"><div><h2>Feature importance</h2><p>Relative contribution in the trained forest</p></div><Info size={18} className="muted-icon" /></div>
          {loading ? <Skeleton className="chart-skeleton" /> : <div className="importance-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={importance} layout="vertical" margin={{ top: 4, right: 12, left: 18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="feature" width={145} tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} contentStyle={{ background: "var(--tooltip)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" }} /><Bar dataKey="importance" radius={[0, 5, 5, 0]} maxBarSize={15}>{importance.map((row, index) => <Cell key={row.feature} fill={colors[index % colors.length]} />)}</Bar></BarChart></ResponsiveContainer></div>}
        </GlassCard>
      </div>
      <GlassCard className="gallery-card"><div className="card-title-row"><div><h2>Evaluation gallery</h2><p>Visual summaries from the model development process</p></div><span className="mini-pill">4 CHARTS</span></div>
        <div className="gallery-grid">{CHARTS.map((chart) => <button className="gallery-item" key={chart.file} onClick={() => setSelectedImage(`/results/${chart.file}`)}><div className="gallery-image"><img src={`/results/${chart.file}`} alt={chart.title} loading="lazy" /></div><div className="gallery-caption"><div><strong>{chart.title}</strong><span>{chart.subtitle}</span></div><span className="zoom-label">View ↗</span></div></button>)}</div>
      </GlassCard>
      <GlassCard className="about-card"><div className="about-icon"><Info size={19} /></div><div className="about-copy"><p className="eyebrow">ABOUT THIS MODEL</p><h2>Built for learning and exploration</h2><p>Trained on the Give Me Some Credit dataset using a Random Forest classifier to estimate whether a client may experience financial distress within two years. The dataset is imbalanced, so precision and recall should be considered alongside the ROC-AUC.</p></div><div className="about-stat"><span>Decision threshold</span><strong>{metrics ? `${(metrics.threshold * 100).toFixed(1)}%` : "—"}</strong></div></GlassCard>
      <AnimatePresence>{selectedImage && <motion.div className="image-modal" role="dialog" aria-modal="true" aria-label="Chart preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)}><button className="modal-close" aria-label="Close image" onClick={() => setSelectedImage(null)}><X size={20} /></button><motion.img src={selectedImage} alt="Expanded model evaluation chart" initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={(event) => event.stopPropagation()} /></motion.div>}</AnimatePresence>
    </div>
  );
}

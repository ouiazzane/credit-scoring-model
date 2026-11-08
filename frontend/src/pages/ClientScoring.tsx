import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, CheckCircle2, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { api } from "../api/client";
import { FieldSlider } from "../components/FieldSlider";
import { Gauge } from "../components/Gauge";
import { GlassCard } from "../components/GlassCard";
import { RiskBadge } from "../components/RiskBadge";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { FIELD_INFO, PRESETS } from "../lib/constants";
import type { Client, Evaluation, Prediction } from "../types";

const groups: { title: string; fields: (keyof Client)[] }[] = [
  { title: "Personal profile", fields: ["age", "NumberOfDependents"] },
  { title: "Financial situation", fields: ["MonthlyIncome", "DebtRatio", "RevolvingUtilizationOfUnsecuredLines"] },
  { title: "Credit history", fields: ["NumberOfOpenCreditLinesAndLoans", "NumberRealEstateLoansOrLines", "NumberOfTime30-59DaysPastDueNotWorse", "NumberOfTime60-89DaysPastDueNotWorse", "NumberOfTimes90DaysLate"] },
];

interface Props {
  client: Client;
  setClient: (client: Client) => void;
  prediction: Prediction | null;
  setPrediction: (prediction: Prediction) => void;
  onEvaluation: (entry: Evaluation) => void;
  notify: (message: string, type: "success" | "error") => void;
}

export function ClientScoring({ client, setClient, prediction, setPrediction, onEvaluation, notify }: Props) {
  const [incomeUnknown, setIncomeUnknown] = useState(client.MonthlyIncome === null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scoringClient = useMemo(
    () => ({ ...client, MonthlyIncome: incomeUnknown ? null : client.MonthlyIncome }),
    [client, incomeUnknown],
  );
  const debouncedClient = useDebouncedValue(scoringClient, 400);
  const update = (key: keyof Client, value: number) => setClient({ ...client, [key]: value });

  const evaluate = useCallback(async (profile: Client, quiet = false) => {
    setLoading(true);
    setError("");
    try {
      const result = await api.predict(profile);
      setPrediction(result);
      onEvaluation({
        id: `${Date.now()}-${Math.random()}`,
        date: new Date().toISOString(),
        client: profile,
        probability: result.probability,
        decision: result.decision,
        riskLevel: result.risk_level,
      });
      if (!quiet) notify("Client evaluation completed.", "success");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not evaluate this client.";
      setError(message);
      if (!quiet) notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify, onEvaluation, setPrediction]);

  useEffect(() => {
    if (live) void evaluate(debouncedClient, true);
  }, [debouncedClient, live, evaluate]);

  const validation = useMemo(() => {
    if (client.age < 18 || client.age > 120) return "Age must be between 18 and 120.";
    return "";
  }, [client.age]);

  const formatFactor = (name: keyof Client) => FIELD_INFO[name]?.label ?? name;
  const explanation = prediction
    ? prediction.decision === "Low risk"
      ? "This profile is below the model's decision threshold. This is a statistical estimate, not a lending recommendation."
      : "This profile meets or exceeds the model's decision threshold. Review the strongest contributing factors before drawing conclusions."
    : "Enter a client profile and evaluate it to see a model-based estimate.";

  return (
    <div className="page-grid">
      <div className="page-intro">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> CLIENT ASSESSMENT</p>
          <h1>Client scoring</h1>
          <p className="page-subtitle">Explore a two-year default probability using the trained model.</p>
        </div>
        <div className="model-chip"><span className="status-dot" /> Random Forest</div>
      </div>

      <div className="scoring-layout">
        <div className="form-column">
          <div className="preset-row" aria-label="Client presets">
            {Object.entries(PRESETS).map(([label, preset]) => (
              <button key={label} className="preset-button" onClick={() => { setClient(preset); setIncomeUnknown(false); }}>
                {label === "Safe client" ? <CheckCircle2 size={15} /> : label === "Risky client" ? <Activity size={15} /> : <Sparkles size={15} />}
                {label}
              </button>
            ))}
            <button className="icon-button reset-button" title="Reset profile" aria-label="Reset profile" onClick={() => { setClient(PRESETS["Average client"]); setIncomeUnknown(false); }}><RotateCcw size={15} /></button>
          </div>

          {groups.map((group, groupIndex) => (
            <motion.div key={group.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIndex * 0.07 }}>
              <GlassCard className="form-card">
                <div className="section-title"><span className="section-number">0{groupIndex + 1}</span><div><h2>{group.title}</h2><p>Adjust values to match the client profile</p></div></div>
                <div className="field-grid">
                  {group.fields.map((field) => {
                    if (field === "MonthlyIncome" && incomeUnknown) return null;
                    const info = FIELD_INFO[field];
                    return (
                      <FieldSlider
                        key={field}
                        label={info.label}
                        description={info.description}
                        min={info.min}
                        max={info.max}
                        step={info.step}
                        value={Number(client[field] ?? 0)}
                        error={field === "age" ? validation : undefined}
                        unit={field === "MonthlyIncome" ? "USD" : undefined}
                        onChange={(value) => update(field, info.integer ? Math.round(value) : value)}
                      />
                    );
                  })}
                </div>
                {group.title === "Financial situation" && (
                  <label className="switch-row">
                    <span className={`switch ${incomeUnknown ? "switch-on" : ""}`}><input type="checkbox" checked={incomeUnknown} onChange={(event) => { setIncomeUnknown(event.target.checked); if (event.target.checked) setClient({ ...client, MonthlyIncome: null }); else setClient({ ...client, MonthlyIncome: 5400 }); }} /><span /></span>
                    <span><strong>Income unknown</strong><small>Use the model's built-in missing-income handling</small></span>
                  </label>
                )}
              </GlassCard>
            </motion.div>
          ))}
          <div className="evaluate-row">
            <button className="primary-button" disabled={loading || Boolean(validation)} onClick={() => void evaluate(scoringClient)}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "Evaluating profile…" : "Evaluate client"}
              {!loading && <ArrowUpRight size={17} />}
            </button>
            <label className="live-toggle"><span className={`switch ${live ? "switch-on" : ""}`}><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /><span /></span><span>Live mode</span></label>
          </div>
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>

        <aside className="result-column">
          <GlassCard className="result-card">
            <div className="result-heading"><div><p className="eyebrow">ASSESSMENT RESULT</p><h2>Risk overview</h2></div><div className="result-icon"><Activity size={19} /></div></div>
            {prediction ? (
              <motion.div key={prediction.probability} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Gauge probability={prediction.probability} threshold={prediction.threshold} />
                <RiskBadge decision={prediction.decision} riskLevel={prediction.risk_level} />
              </motion.div>
            ) : (
              <div className="empty-gauge"><div className="empty-gauge-ring"><Activity size={26} /></div><strong>Your result will appear here</strong><span>Run an assessment to see the estimate and key factors.</span></div>
            )}
            <p className="result-explanation">{explanation}</p>
            <div className="threshold-note"><span>Decision threshold</span><strong>{prediction ? `${(prediction.threshold * 100).toFixed(1)}%` : "—"}</strong></div>
          </GlassCard>

          <GlassCard className="factor-card">
            <div className="card-title-row"><div><h2>Top contributing factors</h2><p>Estimated with one-at-a-time what-if changes</p></div><span className="mini-pill">TOP 3</span></div>
            {prediction ? (
              <div className="factor-list">
                {prediction.top_factors.map((factor, index) => {
                  const increases = factor.direction === "increases";
                  return <div key={factor.feature} className="factor-item">
                    <div className="factor-rank">0{index + 1}</div>
                    <div className="factor-main"><div className="factor-name">{formatFactor(factor.feature)}<span className={`factor-direction ${increases ? "direction-up" : "direction-down"}`}>{increases ? "↑" : "↓"}</span></div><div className="factor-track"><motion.div className={`factor-fill ${increases ? "fill-risk" : "fill-good"}`} initial={{ width: 0 }} animate={{ width: `${Math.max(4, factor.importance / (prediction.top_factors[0]?.importance || 1) * 100)}%` }} /></div></div>
                    <strong className={increases ? "text-risk" : "text-good"}>{increases ? "+" : "−"}{(factor.importance * 100).toFixed(1)}<small> pts</small></strong>
                  </div>;
                })}
              </div>
            ) : <p className="empty-copy">Factors will be calculated after your first evaluation.</p>}
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

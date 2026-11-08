import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, GitCompareArrows, LoaderCircle, Plus, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { FieldSlider } from "../components/FieldSlider";
import { GlassCard } from "../components/GlassCard";
import { FIELD_INFO } from "../lib/constants";
import type { Client } from "../types";

interface Props { client: Client; notify: (message: string, type: "success" | "error") => void; }

export function Simulator({ client, notify }: Props) {
  const [fields, setFields] = useState<(keyof Client)[]>(["DebtRatio"]);
  const [values, setValues] = useState<Partial<Client>>({ DebtRatio: client.DebtRatio });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ before_probability: number; after_probability: number; change: number } | null>(null);

  const available = useMemo(() => (Object.keys(FIELD_INFO) as (keyof Client)[]).filter((key) => !fields.includes(key)), [fields]);
  const changeField = (index: number, field: keyof Client) => {
    const next = [...fields];
    const previous = next[index];
    next[index] = field;
    const nextValues = { ...values };
    delete nextValues[previous];
    nextValues[field] = client[field] ?? 0;
    setFields(next);
    setValues(nextValues);
    setResult(null);
  };
  const run = async () => {
    if (fields.length < 1 || fields.length > 3) return;
    setLoading(true);
    try {
      const response = await api.simulate(client, values);
      setResult(response);
      notify("Scenario comparison ready.", "success");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not compare this scenario.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="page-intro">
        <div><p className="eyebrow"><span className="eyebrow-dot" /> SCENARIO LAB</p><h1>What-if simulator</h1><p className="page-subtitle">Change up to three client details and compare the estimated outcome.</p></div>
        <div className="model-chip"><GitCompareArrows size={15} /> Scenario analysis</div>
      </div>
      <div className="simulator-layout">
        <GlassCard className="simulator-card">
          <div className="section-title"><span className="section-number"><GitCompareArrows size={16} /></span><div><h2>Build a scenario</h2><p>Starting from the current client profile</p></div></div>
          <div className="scenario-list">
            {fields.map((field, index) => {
              const info = FIELD_INFO[field];
              return <div className="scenario-field" key={`${field}-${index}`}>
                <div className="scenario-select-row">
                  <label htmlFor={`scenario-field-${index}`}>Variable {index + 1}</label>
                  {fields.length > 1 && <button className="icon-button remove-field" aria-label={`Remove ${info.label}`} onClick={() => { setFields(fields.filter((_, position) => position !== index)); const next = { ...values }; delete next[field]; setValues(next); setResult(null); }}><X size={15} /></button>}
                </div>
                <select id={`scenario-field-${index}`} value={field} onChange={(event) => changeField(index, event.target.value as keyof Client)}>
                  {[field, ...available].map((option) => <option key={option} value={option}>{FIELD_INFO[option].label}</option>)}
                </select>
                <div className="scenario-baseline">Current value <strong>{client[field] ?? "Unknown"}</strong><span>→</span> New value</div>
                {field === "MonthlyIncome" ? <div className="income-scenario"><FieldSlider label={info.label} description={info.description} value={Number(values[field] ?? 0)} min={info.min} max={info.max} step={info.step} onChange={(value) => { setValues({ ...values, [field]: value }); setResult(null); }} /><label className="checkbox-line"><input type="checkbox" checked={values.MonthlyIncome === null} onChange={(event) => { setValues({ ...values, MonthlyIncome: event.target.checked ? null : 5400 }); setResult(null); }} /> Set income as unknown</label></div>
                  : <FieldSlider label={info.label} description={info.description} value={Number(values[field] ?? 0)} min={info.min} max={info.max} step={info.step} onChange={(value) => { setValues({ ...values, [field]: info.integer ? Math.round(value) : value }); setResult(null); }} />}
              </div>;
            })}
          </div>
          {fields.length < 3 && <button className="add-variable" onClick={() => { const next = available[0]; if (next) { setFields([...fields, next]); setValues({ ...values, [next]: client[next] ?? 0 }); } }}><Plus size={16} /> Add another variable <span>{fields.length}/3</span></button>}
          <button className="primary-button simulate-button" disabled={loading} onClick={() => void run()}>{loading ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}{loading ? "Comparing scenarios…" : "Compare scenario"}<ArrowUpRight size={17} /></button>
        </GlassCard>
        <GlassCard className="comparison-card">
          <p className="eyebrow">PROBABILITY COMPARISON</p><h2>Scenario impact</h2>
          {result ? (
            <motion.div key={`${result.before_probability}-${result.after_probability}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="comparison-values">
                <div><span>Current</span><strong>{(result.before_probability * 100).toFixed(1)}<small>%</small></strong></div>
                <div className="compare-arrow"><ArrowUpRight size={19} /></div>
                <div><span>Scenario</span><strong className={result.change <= 0 ? "text-good" : "text-risk"}>{(result.after_probability * 100).toFixed(1)}<small>%</small></strong></div>
              </div>
              <div className="compare-bar"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(result.before_probability * 100, 100)}%` }} className="bar-before" /><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(result.after_probability * 100, 100)}%` }} className="bar-after" /></div>
              <div className={`impact-message ${result.change <= 0 ? "impact-good" : "impact-risk"}`}>
                {result.change <= 0 ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                <div><strong>{Math.abs(result.change * 100).toFixed(1)} percentage point{Math.abs(result.change * 100) === 1 ? "" : "s"} {result.change <= 0 ? "lower" : "higher"}</strong><p>The model estimates a {result.change <= 0 ? "decrease" : "increase"} from your selected changes.</p></div>
              </div>
              <p className="result-explanation">This is a simple scenario comparison—not a causal estimate. The model's prediction can change due to interactions between inputs.</p>
            </motion.div>
          ) : (
            <div className="sim-empty"><div className="empty-gauge-ring"><GitCompareArrows size={24} /></div><strong>Explore a possible change</strong><p>Pick one or more variables and compare the result against the current profile.</p></div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

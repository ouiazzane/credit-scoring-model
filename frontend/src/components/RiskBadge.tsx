import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Prediction } from "../types";

export function RiskBadge({ decision, riskLevel }: { decision: Prediction["decision"]; riskLevel: Prediction["risk_level"] }) {
  const low = decision === "Low risk";
  const Icon = low ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`risk-badge ${low ? "risk-low" : "risk-high"}`}>
      <Icon size={18} aria-hidden="true" />
      <span>{decision}</span>
      <span className={`risk-level risk-${riskLevel.toLowerCase().replace(" ", "-")}`}>{riskLevel} risk</span>
    </div>
  );
}

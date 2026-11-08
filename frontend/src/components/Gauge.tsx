import { motion } from "framer-motion";

function point(value: number, radius: number) {
  const angle = Math.PI - Math.max(0, Math.min(1, value)) * Math.PI;
  return { x: 100 + radius * Math.cos(angle), y: 104 - radius * Math.sin(angle) };
}

export function Gauge({ probability, threshold }: { probability: number; threshold: number }) {
  const ceiling = Math.min(1, Math.max(0.5, threshold * 1.45));
  const progress = Math.min(1, probability / ceiling);
  const marker = point(threshold / ceiling, 80);
  const value = point(progress, 80);
  const color = probability < threshold * 0.5 ? "#27c89a" : probability <= threshold ? "#f5b942" : probability <= threshold * 1.3 ? "#fb873b" : "#f05d72";

  return (
    <div className="gauge-wrap" role="img" aria-label={`Default probability ${Math.round(probability * 100)} percent. Decision threshold ${Math.round(threshold * 100)} percent.`}>
      <svg viewBox="0 0 200 122" className="gauge-svg" aria-hidden="true">
        <path d="M 20 104 A 80 80 0 0 1 180 104" className="gauge-track" />
        <motion.path
          d="M 20 104 A 80 80 0 0 1 180 104"
          className="gauge-progress"
          stroke={color}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <line x1={marker.x} y1={marker.y} x2={100 + 72 * Math.cos(Math.PI - (threshold / ceiling) * Math.PI)} y2={104 - 72 * Math.sin(Math.PI - (threshold / ceiling) * Math.PI)} className="gauge-threshold" />
        <motion.circle cx={value.x} cy={value.y} r="5" fill={color} initial={false} animate={{ cx: value.x, cy: value.y }} transition={{ duration: 0.8 }} />
      </svg>
      <div className="gauge-value">{Math.round(probability * 100)}<span>%</span></div>
      <div className="gauge-caption">Default probability</div>
      <div className="gauge-scale"><span>0%</span><span>Threshold {Math.round(threshold * 100)}%</span><span>{Math.round(ceiling * 100)}%</span></div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, icon: Icon, hint }: { label: string; value: number; icon: LucideIcon; hint: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => `${(latest * 100).toFixed(1)}%`);
  const [display, setDisplay] = useState("0.0%");
  useEffect(() => {
    const unsubscribe = rounded.on("change", setDisplay);
    const controls = animate(count, value, { duration: 1.1, ease: "easeOut" });
    return () => { unsubscribe(); controls.stop(); };
  }, [count, rounded, value]);
  return (
    <motion.div className="metric-card" whileHover={{ y: -4 }}>
      <div className="metric-icon"><Icon size={18} /></div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{display}</div>
      <p className="metric-hint">{hint}</p>
    </motion.div>
  );
}

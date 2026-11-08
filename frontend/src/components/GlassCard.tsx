import { motion, type HTMLMotionProps } from "framer-motion";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLMotionProps<"section"> & { className?: string }>;

export function GlassCard({ children, className = "", ...props }: Props) {
  return (
    <motion.section
      {...props}
      whileHover={{ y: -2 }}
      className={`glass-card ${className}`}
    >
      {children}
    </motion.section>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, CircleX, X } from "lucide-react";

export interface ToastMessage { id: number; message: string; type: "success" | "error"; }

export function Toasts({ items, dismiss }: { items: ToastMessage[]; dismiss: (id: number) => void }) {
  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence>
        {items.map((toast) => (
          <motion.div key={toast.id} className={`toast toast-${toast.type}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
            {toast.type === "success" ? <CircleCheck size={18} /> : <CircleX size={18} />}
            <span>{toast.message}</span>
            <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={16} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

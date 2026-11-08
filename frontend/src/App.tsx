import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BarChart3, BrainCircuit, Clock3, Moon, Sun, ShieldCheck } from "lucide-react";
import { Toasts, type ToastMessage } from "./components/Toast";
import { Skeleton } from "./components/Skeleton";
import { DEFAULT_CLIENT } from "./lib/constants";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Client, Evaluation, Prediction } from "./types";

type Page = "scoring" | "simulator" | "performance" | "history";
const ClientScoring = lazy(() => import("./pages/ClientScoring").then((module) => ({ default: module.ClientScoring })));
const Simulator = lazy(() => import("./pages/Simulator").then((module) => ({ default: module.Simulator })));
const Performance = lazy(() => import("./pages/Performance").then((module) => ({ default: module.Performance })));
const History = lazy(() => import("./pages/History").then((module) => ({ default: module.History })));
const navigation: { id: Page; label: string; icon: typeof Activity; section?: string }[] = [
  { id: "scoring", label: "Client scoring", icon: Activity, section: "WORKSPACE" },
  { id: "simulator", label: "What-if simulator", icon: BrainCircuit },
  { id: "performance", label: "Model performance", icon: BarChart3, section: "MODEL" },
  { id: "history", label: "History", icon: Clock3 },
];

export default function App() {
  const [page, setPage] = useState<Page>("scoring");
  const [theme, setTheme] = useLocalStorage<"dark" | "light">("credit-score-theme", "dark");
  const [history, setHistory] = useLocalStorage<Evaluation[]>("credit-score-history", []);
  const [client, setClient] = useState<Client>({ ...DEFAULT_CLIENT });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const notify = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => setToasts((items) => items.filter((toast) => toast.id !== id)), 4200);
  }, []);
  const addHistory = useCallback((entry: Evaluation) => {
    setHistory((previous) => [entry, ...previous].slice(0, 20));
  }, [setHistory]);
  const currentPage = navigation.find((item) => item.id === page);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("scoring"); }}><span className="brand-mark"><ShieldCheck size={21} /></span><span><strong>CreditScore</strong><small>AI INSIGHTS</small></span></a>
        <div className="sidebar-caption">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <div key={item.id}>{item.section && <p className="nav-section">{item.section}</p>}<button className={`nav-item ${page === item.id ? "nav-active" : ""}`} aria-current={page === item.id ? "page" : undefined} onClick={() => setPage(item.id)}><Icon size={18} /><span>{item.label}</span>{page === item.id && <span className="nav-indicator" />}</button></div>;
          })}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-model"><div className="model-avatar"><Activity size={16} /></div><div><strong>Random Forest</strong><span>Model ready</span></div><span className="status-dot" /></div><p>Educational use only</p></div>
      </aside>
      <main className="main-shell">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><strong>CreditScore AI</strong></div><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{currentPage?.label}</strong></div><div className="topbar-actions"><span className="privacy-chip"><span className="status-dot" /> Local session</span><button className="theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button></div></header>
        <div className="mobile-nav" aria-label="Main navigation">{navigation.map((item) => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? "mobile-nav-active" : ""} onClick={() => setPage(item.id)} aria-label={item.label}><Icon size={18} /><span>{item.label}</span></button>; })}</div>
        <div className="content-area">
          <AnimatePresence mode="wait">
            <motion.div key={page} className="page-transition" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<div className="page-loading"><Skeleton className="loading-title" /><Skeleton className="loading-panel" /></div>}>
                {page === "scoring" && <ClientScoring client={client} setClient={setClient} prediction={prediction} setPrediction={setPrediction} onEvaluation={addHistory} notify={notify} />}
                {page === "simulator" && <Simulator client={client} notify={notify} />}
                {page === "performance" && <Performance notify={notify} />}
                {page === "history" && <History history={history} setHistory={setHistory} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
          <footer className="app-footer"><span>CreditScore AI <span className="footer-dot">·</span> Educational project. Not for real credit decisions.</span><span>Estimates are informational and may be biased.</span></footer>
        </div>
      </main>
      <Toasts items={toasts} dismiss={(id) => setToasts((items) => items.filter((toast) => toast.id !== id))} />
    </div>
  );
}

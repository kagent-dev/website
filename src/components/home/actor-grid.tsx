"use client";

/*
 * A compact, live take on Agent Substrate's actor view: many registered
 * actors, a few warm worker pods, and the atenet router resuming actors on
 * request. Click any idle actor to send it a request.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const COLS = 24;
const ROWS = 6;
const N = COLS * ROWS;
const WORKERS = 4;
const ACCENT = "#a78bfa";
const KINDS = ["claude", "sandbox", "browser", "mcp", "agent", "adk", "hermes", "codex", "sre", "review", "triage", "docs"];

type State = "idle" | "resuming" | "running" | "suspending";
type Worker = { actor: number | null; prev: number | null; since: number };

const nameOf = (i: number) => `actor/${KINDS[i % KINDS.length]}-${((i * 37) % 211) + 10}`;

const QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

const initialWorkers = (): Worker[] => [17, 52, 89, 126].map((a, i) => ({ actor: a, prev: null, since: -i }));

export default function ActorGrid() {
  const reduce = useReducedMotion();
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [phase, setPhase] = useState<Record<number, State>>({ 17: "running", 52: "running", 89: "running", 126: "running" });
  const [hover, setHover] = useState<number | null>(null);
  const [lastRoute, setLastRoute] = useState("waiting for requests");
  const tick = useRef(0);
  const workersRef = useRef(workers);
  useEffect(() => {
    workersRef.current = workers;
  }, [workers]);

  // Route a request to actor `a`: it resumes onto the worker that has been
  // busy longest, whose current actor suspends to snapshot storage.
  const request = useCallback((a: number) => {
    const ws = workersRef.current;
    if (ws.some((w) => w.actor === a)) return;
    const wi = ws.reduce((best, w, i) => (w.since < ws[best].since ? i : best), 0);
    const evicted = ws[wi].actor;
    tick.current += 1;
    const t = tick.current;
    setWorkers((prev) => prev.map((w, i) => (i === wi ? { actor: a, prev: evicted, since: t } : w)));
    setPhase((p) => ({ ...p, [a]: "resuming", ...(evicted !== null ? { [evicted]: "suspending" } : {}) }));
    setLastRoute(`${nameOf(a)} → worker-${wi + 1} · ${180 + Math.floor(Math.random() * 300)} ms`);
    setTimeout(() => {
      setPhase((p) => {
        const next = { ...p, [a]: "running" as State };
        if (evicted !== null) delete next[evicted];
        return next;
      });
      setWorkers((prev) => prev.map((w, i) => (i === wi ? { ...w, prev: null } : w)));
    }, 900);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      const busy = new Set(workersRef.current.map((w) => w.actor));
      let a = Math.floor(Math.random() * N);
      while (busy.has(a)) a = (a + 1) % N;
      request(a);
    }, 1800);
    return () => clearInterval(timer);
  }, [reduce, request]);

  const counts = Object.values(phase).reduce(
    (c, s) => ({ ...c, [s]: (c[s] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="select-none text-[11px]">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 font-geistmono">
        <span className="tracking-wider text-white/50">ACTORS</span>
        <span className="text-white/45">
          <b className="font-normal text-white">{N}</b> agents · <b className="font-normal text-violet-300">{counts.running ?? 0}</b> running ·{" "}
          <b className="font-normal text-white">{N - (counts.running ?? 0) - (counts.resuming ?? 0)}</b> asleep in snapshot storage
        </span>
      </div>

      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: N }, (_, a) => {
          const s = phase[a] ?? "idle";
          const style: React.CSSProperties =
            s === "running"
              ? { background: ACCENT, boxShadow: `0 0 10px ${ACCENT}88` }
              : s === "resuming"
                ? { border: `1.5px solid ${ACCENT}`, background: `${ACCENT}22` }
                : s === "suspending"
                  ? { border: "1.5px dashed rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)" }
                  : {};
          return (
            <button
              key={a}
              aria-label={`${nameOf(a)}: ${s}${s === "idle" ? ", click to send a request" : ""}`}
              onClick={() => request(a)}
              onMouseEnter={() => setHover(a)}
              className={`aspect-square rounded-[3px] transition-all duration-300 ${s === "idle" ? "bg-white/[0.07] hover:bg-white/25" : ""} ${s === "resuming" ? "animate-pulse" : ""}`}
              style={style}
            />
          );
        })}
      </div>
      <div className="mt-1.5 h-4 font-geistmono text-white/45">
        {hover !== null ? (
          <>
            {nameOf(hover)} · {phase[hover] ?? "suspended"}
            {!phase[hover] && <span className="text-white/30"> · click to send a request</span>}
          </>
        ) : (
          <span className="text-white/30">hover an actor, click to wake it</span>
        )}
      </div>

      <div className="my-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-white/10" />
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 font-geistmono">
          <span className="text-violet-300">⇄</span>
          <b className="font-medium text-white">atenet router</b>
          <span className="max-w-[240px] truncate text-white/50">{lastRoute}</span>
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="mb-2 flex items-baseline justify-between font-geistmono">
        <span className="tracking-wider text-white/50">WARM WORKER PODS</span>
        <span className="text-white/45">{WORKERS} pods · 1 active actor each</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {workers.map((w, i) => {
          const a = w.actor!;
          const s = phase[a] ?? "running";
          const switching = w.prev !== null;
          return (
            <div
              key={i}
              className={`rounded-lg border p-2 font-geistmono transition-colors duration-300 ${switching ? "border-dashed border-white/35" : "border-white/10 bg-white/[0.02]"}`}
            >
              <div className="flex items-center justify-between text-white/45">
                worker-{i + 1}
                <span className={`h-1.5 w-1.5 rounded-full ${switching ? "bg-white/40" : "bg-violet-400"}`} />
              </div>
              <div className="mt-1 truncate text-[11.5px] text-white">{nameOf(a)}</div>
              <div className="mt-0.5 truncate text-[10px] text-white/50">
                {switching ? `⏸ suspending ${nameOf(w.prev!).split("/")[1]}` : s === "resuming" ? "resuming from snapshot" : "running in sandbox"}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div key={a} className="h-full origin-left animate-[grow_1.8s_linear_forwards] rounded-full bg-violet-400" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-geistmono text-white/50">
        <span className="flex items-center gap-1.5">
<span className="h-2 w-2 rounded-[2px] bg-violet-400" /> running
        </span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] border border-violet-400" /> resuming</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] border border-dashed border-white/50" /> suspending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-white/10" /> suspended</span>
      </div>
    </div>
  );
}

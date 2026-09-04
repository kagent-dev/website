"use client";

import { useTick } from "./use-tick";
import { WindowChrome } from "./terminal";

const panelCls = "relative overflow-hidden rounded-lg border border-kg-bd bg-kg-panel px-6 py-[22px]";

function PanelFooter({ label, note }: { label: string; note: string }) {
  return (
    <div className="relative mt-5 flex items-center gap-2.5 border-t border-kg-bd-soft pt-3.5 font-mono text-[11px] tracking-[0.05em] text-kg-tx4">
      <span className="text-kg-acc">{label}</span>
      <span className="ml-auto">{note}</span>
    </div>
  );
}

const LOGS = [
  { msg: "sandbox/triage-agent suspended", tag: "fs snapshot", cls: "text-kg-tx3" },
  { msg: "worker pool rebalanced · 3 freed", tag: "0 vCPU held", cls: "text-kg-tx3" },
  { msg: "sandbox/promql-agent resumed", tag: "47ms", cls: "text-kg-ystr" },
  { msg: "sandbox/cve-scanner scheduled", tag: "microVM", cls: "text-kg-acc" },
  { msg: "sandbox/log-scout resumed", tag: "52ms", cls: "text-kg-ystr" },
];

/** "Sub-100ms resume" — a live resume figure over a stream of lifecycle events. */
export function ResumePanel() {
  const t = useTick();
  const resumeMs = 38 + ((t * 17) % 51);
  return (
    <div className={panelCls}>
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/brand/circles.svg')] bg-[length:140%] bg-center bg-no-repeat opacity-5" />
      <WindowChrome title="substrate · agent lifecycle" className="relative mb-[18px] border-b border-kg-bd-soft pb-3.5" />
      <div className="relative flex items-end gap-3.5">
        <div className="font-display text-[clamp(56px,7vw,92px)] font-medium leading-[0.9] tracking-[-0.04em] text-kg-tx1 tabular-nums">
          {resumeMs}
        </div>
        <div className="pb-2.5 font-mono text-sm tracking-[0.06em] text-kg-acc">ms to resume</div>
      </div>
      <div className="relative mt-[26px] h-1 overflow-hidden rounded-full bg-kg-bd-soft">
        <div className="absolute inset-y-0 left-0 w-1/4 animate-kg-sweep rounded-full bg-gradient-to-r from-transparent to-kg-brand" />
      </div>
      <div className="relative mt-[26px] flex flex-col gap-2">
        {LOGS.map((l, i) => {
          const s = (t * 3 + i * 11) % 60;
          return (
            <div
              key={l.msg}
              className="flex items-center gap-3.5 rounded-[3px] border border-kg-bd-soft bg-kg-sf px-3 py-[9px] font-mono text-[12.5px]"
            >
              <span className="shrink-0 text-kg-tx4 tabular-nums">00:{String(s).padStart(2, "0")}</span>
              <span className="truncate text-kg-tx2">{l.msg}</span>
              <span className={`ml-auto shrink-0 ${l.cls}`}>{l.tag}</span>
            </div>
          );
        })}
      </div>
      <PanelFooter label="resume" note="suspend · snapshot · resume" />
    </div>
  );
}

const TOTAL_AGENTS = 250;
const PODS = 8;
const SLOTS = 36;

/** "250 agents on 8 pods" — worker pools filling and draining. */
export function DensityPanel() {
  const t = useTick();
  const packed = Math.min(TOTAL_AGENTS, 40 + ((t * 23) % (TOTAL_AGENTS - 39)));
  return (
    <div className={panelCls}>
      <WindowChrome title="substrate · worker pools" className="mb-[18px] border-b border-kg-bd-soft pb-3.5" />
      <div className="mb-[22px] flex items-baseline justify-between gap-4">
        <div className="font-display text-[44px] font-medium leading-none tracking-[-0.03em] text-kg-tx1 tabular-nums">
          {packed}
          <span className="text-[22px] text-kg-tx4"> agents</span>
        </div>
        <div className="font-mono text-xs tracking-[0.06em] text-kg-tx3">{PODS} pods</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: PODS }, (_, p) => {
          const base = Math.floor(packed / PODS) + (p < packed % PODS ? 1 : 0);
          return (
            <div key={p} className="rounded border border-kg-bd-soft bg-kg-sf p-3">
              <div className="mb-2.5 font-mono text-[10.5px] tracking-[0.05em] text-kg-tx4">pod-{p + 1}</div>
              <div className="flex flex-wrap gap-[3px]">
                {Array.from({ length: SLOTS }, (_, k) => {
                  // Roughly one in six running cells lights up, picked by a hash of (slot, pod, tick)
                  // so the highlights scatter differently in every pod and reshuffle each beat.
                  const h = ((k + 1) * 73856093) ^ ((p + 1) * 19349663) ^ ((t + 1) * 83492791);
                  const hot = (h >>> 0) % 6 === 0;
                  const cls = k < base ? (hot ? "bg-kg-acc" : "bg-[rgba(139,47,232,0.45)]") : "bg-kg-bd-soft";
                  return <span key={k} className={`h-1.5 w-1.5 rounded-[2px] ${cls}`} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <PanelFooter label="pack" note={`shared worker pools · ${PODS} pods`} />
    </div>
  );
}

const HOSTS = ["api.github.com", "registry.k8s.io", "10.0.0.0/8", "pypi.org", "169.254.169.254"];

/** "Sandboxed by default" — an egress policy deciding per destination. */
export function EgressPanel() {
  const t = useTick();
  return (
    <div className={`${panelCls} p-6 font-mono text-[13px]`}>
      <WindowChrome title="sandbox/triage-agent · egress policy" className="mb-4 border-b border-kg-bd-soft pb-3.5" />
      <div className="flex flex-col gap-2.5">
        {HOSTS.map((host, i) => {
          const allowed = i < 2 || (i === 3 && t % 4 < 2);
          return (
            <div
              key={host}
              className={`flex items-center gap-3 rounded-[3px] border-l-2 bg-kg-sf px-2.5 py-[7px] ${allowed ? "border-l-kg-ystr" : "border-l-[#DC2626]"}`}
            >
              <span className="text-xs text-kg-tx4" aria-hidden>
                →
              </span>
              <span className="text-xs text-kg-tx2">{host}</span>
              <span
                className={`ml-auto rounded-full px-2.5 py-[3px] text-[11px] tracking-[0.06em] ${
                  allowed ? "bg-[rgba(34,197,94,0.12)] text-kg-ystr" : "bg-[rgba(239,68,68,0.12)] text-[#DC2626]"
                }`}
              >
                {allowed ? "allowed" : "denied"}
              </span>
            </div>
          );
        })}
      </div>
      <PanelFooter label="isolate" note="own filesystem · no privilege escalation" />
    </div>
  );
}

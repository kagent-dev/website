"use client";

import { Bot, RefreshCw } from "lucide-react";
import { Chip, Frame, Tag, dotGrid } from "./blueprint";
import { useTick } from "./use-tick";

const AGENTS = 9;
/** Ticks an agent spends running, then suspended, before the cycle repeats. */
const PERIOD = 8;

/**
 * "Sub-100ms resume" — a worker pool of agents suspending and resuming.
 * Each agent runs for half a period and sleeps for the other half, staggered
 * so a couple of them change state on every beat; a resumed agent shows how
 * long it took to come back.
 */
export function ResumePanel() {
  const t = useTick(900);
  const agents = Array.from({ length: AGENTS }, (_, i) => {
    const phase = (t + i * 3) % PERIOD;
    const cycle = Math.floor((t + i * 3) / PERIOD);
    const running = phase < PERIOD / 2;
    const ms = 38 + ((i * 31 + cycle * 17) % 51);
    return { running, justResumed: phase === 0, ms, phase };
  });
  const runningCount = agents.filter((a) => a.running).length;
  const last = agents.find((a) => a.justResumed) ?? agents.find((a) => a.running);

  return (
    <Frame label="worker pool · suspend & resume" className={`${dotGrid} px-5 py-10 sm:px-7`}>
      <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
        <figure className="m-0 flex flex-col items-center gap-5">
          <div className="border border-kg-bd bg-kg-panel p-3.5">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {agents.map((a, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Chip icon={Bot} muted={!a.running} />
                  <span
                    key={`${i}-${a.running}`}
                    className={`animate-kg-rise font-mono text-[10.5px] tracking-[0.04em] tabular-nums ${
                      a.running ? (a.justResumed ? "text-kg-acc" : "text-kg-tx3") : "text-kg-tx4"
                    }`}
                  >
                    {a.running ? `${a.ms}ms` : "suspended"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <figcaption className="text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-tx3">
            agent substrate worker pool
            <br />
            <span className="tabular-nums">
              {runningCount} running · {AGENTS - runningCount} suspended
            </span>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-6 pt-1">
          <div>
            <div className="font-mono text-[11px] tracking-[0.08em] text-kg-tx4">last resume</div>
            <div className="mt-1 flex items-baseline gap-2 font-display text-[44px] font-medium leading-none tracking-[-0.03em] text-kg-tx1 tabular-nums">
              {last?.ms ?? 47}
              <span className="font-mono text-sm tracking-[0.06em] text-kg-acc">ms</span>
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0 font-mono text-[12px] tracking-[0.05em] text-kg-tx2">
            <li className="flex items-center gap-3.5">
              <Chip icon={Bot} /> running
            </li>
            <li className="flex items-center gap-3.5">
              <Chip icon={Bot} muted /> suspended · 0 vCPU
            </li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

/** The per-pod process overhead: runtime, sidecars, health checks. */
function Overhead({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kg-tx3 text-kg-tx3 ${className}`}
    >
      <RefreshCw className="h-[15px] w-[15px]" />
    </span>
  );
}

const podCls = "relative flex flex-col justify-between border border-kg-bd bg-kg-panel";

/**
 * "30× more agents" — pod per agent against a worker pool: the same agents,
 * with the process overhead paid once instead of once per agent. The pool
 * keeps more agents than it has compute for; the idle ones hold nothing.
 */
export function DensityPanel() {
  const t = useTick(900);
  return (
    <Frame label="density · pod per agent vs agent substrate" className={`${dotGrid} px-5 py-10 sm:px-7`}>
      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-8">
        <figure className="m-0 flex flex-col items-center gap-5">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${podCls} h-[96px] w-[96px] p-2`}>
                <Chip icon={Bot} />
                <Overhead className="self-end" />
              </div>
            ))}
          </div>
          <figcaption className="text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-tx3">
            pod per agent
            <br />4 agents · 4× overhead
          </figcaption>
        </figure>

        <figure className="m-0 flex flex-col items-center gap-5">
          <div className={`${podCls} h-[202px] w-[202px] p-3`}>
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }, (_, i) => {
                // Two or three agents are always idle: the pool is oversubscribed on purpose.
                const idle = (t + i * 4) % 9 < 3;
                return <Chip key={i} icon={Bot} muted={idle} />;
              })}
            </div>
            <Overhead className="self-end" />
          </div>
          <figcaption className="text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-acc">
            agent substrate worker pool
            <br />9 agents · 1× overhead
          </figcaption>
        </figure>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <div className="flex items-baseline gap-2 font-display text-[44px] font-medium leading-none tracking-[-0.03em] text-kg-tx1 tabular-nums">
          30×
          <span className="font-mono text-sm tracking-[0.06em] text-kg-acc">agents per pod</span>
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0 font-mono text-[12px] tracking-[0.05em] text-kg-tx2">
          <li className="flex items-center gap-3">
            <Chip icon={Bot} /> agent
          </li>
          <li className="flex items-center gap-3">
            <Overhead /> pod overhead
          </li>
        </ul>
      </div>
    </Frame>
  );
}

const HOSTS = ["api.github.com", "registry.k8s.io", "10.0.0.0/8", "pypi.org", "169.254.169.254"];

/** "Sandboxed by default" — an agent inside its sandbox, with egress decided per destination. */
export function EgressPanel() {
  const t = useTick();
  return (
    <Frame label="sandbox · egress policy" className={`${dotGrid} px-5 py-10 sm:px-7`}>
      <div className="flex flex-wrap items-center justify-center gap-x-0 gap-y-8">
        <figure className="m-0 flex flex-col items-center gap-4">
          <div className={`${podCls} h-[132px] w-[132px] items-center justify-center gap-3 p-3`}>
            <Chip icon={Bot} />
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-kg-tx3">triage-agent</span>
          </div>
          <figcaption className="max-w-[132px] text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-tx3">
            sandbox · own fs · no privilege escalation
          </figcaption>
        </figure>

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {HOSTS.map((host, i) => {
            const allowed = i < 2 || (i === 3 && t % 4 < 2);
            return (
              <li key={host} className="flex items-center">
                <span
                  className={`h-0 w-8 shrink-0 border-t border-dashed transition-colors duration-500 sm:w-12 ${allowed ? "border-kg-ystr" : "border-kg-bd"}`}
                  aria-hidden
                />
                <Tag className={`gap-3 transition-colors duration-500 ${allowed ? "text-kg-tx2" : ""}`}>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500 ${allowed ? "bg-kg-ystr" : "bg-[#DC2626]"}`}
                    aria-hidden
                  />
                  {host}
                  <span className={`ml-2 tracking-[0.06em] ${allowed ? "text-kg-ystr" : "text-[#DC2626]"}`}>
                    {allowed ? "allowed" : "denied"}
                  </span>
                </Tag>
              </li>
            );
          })}
        </ul>
      </div>
    </Frame>
  );
}

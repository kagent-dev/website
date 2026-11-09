"use client";

/*
 * "Give each agent a job": pick an agent, watch it run its job (tool calls,
 * approvals, Substrate resume/suspend), or flip to the YAML that defines it.
 * Cycles through the agents on its own until someone clicks.
 */

import { useEffect, useRef, useState } from "react";
import { AGENTS } from "./agents";

type Step =
  | { k: "sys"; text: string }
  | { k: "user"; text: string }
  | { k: "tool"; name: string; server: string }
  | { k: "approve"; text: string }
  | { k: "out"; text: string };

const RUNS: Record<string, { trigger: string; steps: Step[]; stats: string }> = {
  "sre-incident-commander": {
    trigger: "PagerDuty · checkout 5xx > 2%",
    steps: [
      { k: "tool", name: "k8s_get_events", server: "kagent-tool-server" },
      { k: "tool", name: "query_prometheus", server: "kagent-grafana-mcp" },
      { k: "out", text: "checkout-v2 is OOMKilled since the 1.42 rollout. Rolling back should fix it." },
      { k: "approve", text: "kubectl rollout undo deploy/checkout-v2 · approved by dana" },
      { k: "out", text: "Rolled back. Error rate is back to 0.02%. Follow-up issue opened." },
    ],
    stats: "3 tool calls · 1 approval · 41s",
  },
  "pr-reviewer": {
    trigger: "GitHub · pull request #482 opened",
    steps: [
      { k: "tool", name: "pull_request_read", server: "github-mcp" },
      { k: "tool", name: "get-library-docs", server: "context7-mcp" },
      { k: "out", text: "1 blocking: useEffect fetch without an abort signal. 2 naming nits." },
      { k: "tool", name: "pull_request_review_write", server: "github-mcp" },
      { k: "out", text: "Review posted on #482 with 3 inline comments." },
    ],
    stats: "3 tool calls · 18s",
  },
  "jira-triage": {
    trigger: "Schedule · every day at 09:15",
    steps: [
      { k: "tool", name: "jira_search", server: "atlassian-mcp" },
      { k: "tool", name: "get_file_contents", server: "github-mcp" },
      { k: "out", text: "11 new issues: 4 bugs, 5 requests, 2 duplicates linked." },
      { k: "tool", name: "jira_update_issue", server: "atlassian-mcp" },
      { k: "out", text: "PLAT-1204 (Safari login loop) assigned to the auth team, priority High." },
    ],
    stats: "4 tool calls · 26s",
  },
  "design-to-code": {
    trigger: "Slack · “build the new pricing card”",
    steps: [
      { k: "tool", name: "get_design_context", server: "figma-mcp" },
      { k: "tool", name: "get_variable_defs", server: "figma-mcp" },
      { k: "out", text: "Generated PricingCard.tsx using 6 design tokens from the Acme library." },
      { k: "tool", name: "create_pull_request", server: "github-mcp" },
      { k: "out", text: "Opened PR #517 with a screenshot diff against the Figma frame." },
    ],
    stats: "3 tool calls · 1m 12s",
  },
  "cve-watch": {
    trigger: "Schedule · every night at 02:00",
    steps: [
      { k: "tool", name: "list_global_security_advisories", server: "github-mcp" },
      { k: "tool", name: "ask_question", server: "deepwiki-mcp" },
      { k: "out", text: "17 new advisories. 2 base images still ship OpenSSL 3.0.13." },
      { k: "approve", text: "open 2 issues for base image upgrades · approved by sam" },
      { k: "out", text: "Opened 2 issues and tagged the platform team." },
    ],
    stats: "2 tool calls · 1 approval · 33s",
  },
  "k8s-cost-optimizer": {
    trigger: "Schedule · every Monday at 06:00",
    steps: [
      { k: "tool", name: "query_prometheus", server: "kagent-grafana-mcp" },
      { k: "tool", name: "k8s_get_resources", server: "kagent-tool-server" },
      { k: "out", text: "4 deployments request 2× their p95 usage. search-indexer alone: $920/mo." },
      { k: "out", text: "Opened a right-sizing PR. Estimated saving: $1,840/month." },
    ],
    stats: "2 tool calls · 22s",
  },
  "docs-librarian": {
    trigger: "Slack · “how do we rotate the payments API key?”",
    steps: [
      { k: "tool", name: "notion-search", server: "notion-mcp" },
      { k: "tool", name: "read_wiki_contents", server: "deepwiki-mcp" },
      { k: "out", text: "Rotate in Stripe, update payments-stripe in Vault; External Secrets syncs in 5 min." },
      { k: "out", text: "Answered in thread with 3 citations." },
    ],
    stats: "2 tool calls · 9s",
  },
  "billing-ops": {
    trigger: "Zendesk · refund request #88213",
    steps: [
      { k: "tool", name: "list_customers", server: "stripe-mcp" },
      { k: "tool", name: "find_issues", server: "sentry-mcp" },
      { k: "out", text: "Charge failed twice due to a checkout bug; customer was billed once." },
      { k: "approve", text: "stripe: refund $49.00 to card •••• 4242 · approved by lee" },
      { k: "out", text: "Refund issued and the ticket updated with the Sentry link." },
    ],
    stats: "2 tool calls · 1 approval · 27s",
  },
};

const STEP_MS = 850;

export default function Jobs() {
  const [i, setI] = useState(0);
  const [view, setView] = useState<"run" | "yaml">("run");
  const [shown, setShown] = useState(0);
  const [auto, setAuto] = useState(true);
  const [runId, setRunId] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const a = AGENTS[i];
  const run = RUNS[a.name];
  // header line, resume line, trigger, steps..., done line, suspend line
  const lines = run.steps.length + 4;
  const done = shown >= lines;

  useEffect(() => {
    if (view !== "run") return;
    if (shown < lines) {
      const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 300 : STEP_MS);
      return () => clearTimeout(t);
    }
    if (auto) {
      const t = setTimeout(() => {
        setI((x) => (x + 1) % AGENTS.length);
        setShown(0);
        setRunId((r) => r + 1);
      }, 2600);
      return () => clearTimeout(t);
    }
  }, [shown, lines, view, auto]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [shown]);

  const pick = (idx: number) => {
    setAuto(false);
    setI(idx);
    setShown(0);
    setRunId((r) => r + 1);
  };

  const stepNode = (s: Step, k: number) => {
    if (s.k === "tool")
      return (
        <div key={k} className="flex w-fit items-center gap-2 rounded-full border border-ks-line px-2.5 py-0.5 font-geistmono text-[11.5px] text-ks-muted">
          <span className="text-ks-accent">⚙</span> {s.name} <span className="text-white/30">· {s.server}</span>
        </div>
      );
    if (s.k === "approve")
      return (
        <div key={k} className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-[13px]">
          <span className="text-emerald-400">✓ approved</span> <span className="font-geistmono text-[12px] text-white/75">{s.text}</span>
        </div>
      );
    if (s.k === "out") return <div key={k} className="text-[14px] leading-relaxed text-white/85">{s.text}</div>;
    return <div key={k} className="text-sm text-white/70">{s.text}</div>;
  };

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_460px]">
      <div>
        <div className="flex flex-wrap gap-2">
          {AGENTS.map((x, idx) => (
            <button
              key={x.name}
              onClick={() => pick(idx)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition ${idx === i ? "bg-white text-black" : "bg-ks-card2 text-white/70 hover:text-white"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-white/85">{a.body}</p>

        <dl className="mt-6 grid max-w-md grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-ks-muted">Triggered by</dt>
          <dd className="text-white/85">{run.trigger}</dd>
          <dt className="text-ks-muted">Model</dt>
          <dd className="font-geistmono text-[13px] text-white/85">{a.model}</dd>
          <dt className="text-ks-muted">Harness</dt>
          <dd className="font-geistmono text-[13px] text-white/85">{a.harness} · gVisor</dd>
          <dt className="text-ks-muted">Tools</dt>
          <dd className="flex flex-wrap gap-1.5">
            {a.tools.map((t) => <span key={t} className="rounded bg-ks-card2 px-2 py-0.5 font-geistmono text-[12px] text-white/80">{t}</span>)}
          </dd>
        </dl>

        <a href="/docs/kagent/1.x/agents" className="mt-8 inline-block rounded-full bg-ks-card2 px-5 py-2.5 text-sm text-white transition hover:bg-white/15">
          Explore agent docs
        </a>
      </div>

      <div className="rounded-[28px] border border-ks-line bg-ks-card p-3">
        <div className="rounded-[20px] bg-ks-bg">
          <div className="flex items-center gap-3 border-b border-ks-line px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: a.color }}>
              <span className={`h-2 w-2 rounded-full bg-black ${!done && view === "run" ? "animate-pulse" : ""}`} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{a.label}</div>
              <div className="truncate font-geistmono text-[11px] text-ks-muted">
                {view === "run" ? (done ? "suspended to snapshot · worker freed" : shown > 1 ? "running in gVisor sandbox" : "resuming…") : a.name}
              </div>
            </div>
            <div className="flex rounded-full bg-ks-card2 p-0.5 text-xs">
              {(["run", "yaml"] as const).map((v) => (
                <button key={v} onClick={() => { setView(v); setAuto(false); }} className={`rounded-full px-3 py-1 transition ${view === v ? "bg-white text-black" : "text-white/60 hover:text-white"}`}>
                  {v === "run" ? "Live run" : "YAML"}
                </button>
              ))}
            </div>
          </div>

          {view === "run" ? (
            <div key={runId} ref={listRef} className="h-[400px] space-y-3 overflow-y-auto px-4 py-4">
              {shown > 0 && (
                <div className="font-geistmono text-[11px] text-white/40">▶ {run.trigger}</div>
              )}
              {shown > 1 && (
                <div className="flex items-center gap-3 font-geistmono text-[11px] text-ks-muted">
                  <span className="h-px flex-1 bg-ks-line" />
                  actor resumed from snapshot in {220 + ((i * 53) % 260)} ms
                  <span className="h-px flex-1 bg-ks-line" />
                </div>
              )}
              {run.steps.slice(0, Math.max(0, shown - 2)).map(stepNode)}
              {shown >= lines - 1 && (
                <div className="text-sm text-emerald-400">✓ Done · {run.stats}</div>
              )}
              {shown >= lines && (
                <div className="flex items-center gap-3 font-geistmono text-[11px] text-ks-muted">
                  <span className="h-px flex-1 bg-ks-line" />
                  idle · actor suspended to snapshot
                  <span className="h-px flex-1 bg-ks-line" />
                </div>
              )}
              {!done && shown > 0 && <div className="font-geistmono text-[12px] text-white/40">working…</div>}
              {done && (
                <button onClick={() => { setShown(0); setRunId((r) => r + 1); setAuto(false); }} className="rounded-full border border-ks-line px-3 py-1 text-xs text-ks-muted transition hover:text-white">
                  ↻ Replay
                </button>
              )}
            </div>
          ) : (
            <pre className="h-[400px] overflow-auto px-4 py-4 font-geistmono text-[11.5px] leading-5 text-white/80">{`kind: AgentTemplate
metadata:
  name: ${a.name}
spec:
  modelConfig:
    name: ${a.model}
  tools:
${a.tools.map((t) => `  - mcp:\n      server:\n        kind: RemoteMCPServer\n        name: ${t}`).join("\n")}
---
kind: Agent
metadata:
  name: ${a.name}
spec:
  template:
    ref:
      name: ${a.name}
  harnessRef:
    name: ${a.harness}`}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

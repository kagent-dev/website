"use client";

/*
 * Interactive kagent chat demo. Everything is scripted and runs in the
 * browser; no cluster is involved. It mimics real kagent + Substrate
 * behaviour: MCP tool calls, human-in-the-loop approvals, and actors that
 * suspend to a snapshot when idle and resume on the next message.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Step =
  | { t: "text"; text: string }
  | { t: "tool"; name: string; server: string }
  | { t: "approval"; cmd: string; approve: Step[]; reject: Step[] };

type Msg =
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "agent"; text: string; done: boolean }
  | { id: number; kind: "tool"; name: string; server: string }
  | { id: number; kind: "approval"; cmd: string; status: "pending" | "approved" | "rejected"; approve: Step[]; reject: Step[] }
  | { id: number; kind: "event"; text: string };

type Script = { match: RegExp; steps: Step[] };

export type DemoAgent = {
  id: string;
  label: string;
  color: string;
  pool: string;
  preview: string;
  time: string;
  suggestions: string[];
  history: Step[];
  historyUser?: string;
  scripts: Script[];
  fallback: Step[];
};

const T = (text: string): Step => ({ t: "text", text });
const TOOL = (name: string, server: string): Step => ({ t: "tool", name, server });

export const DEMO: DemoAgent[] = [
  {
    id: "sre-incident-commander",
    label: "Incident Commander",
    color: "#34d399",
    pool: "kagent-high",
    preview: "rollback drafted, waiting on your ok.",
    time: "Yesterday",
    historyUser: "checkout is throwing 502s. what's going on?",
    history: [
      TOOL("k8s_get_events", "kagent-tool-server"),
      T("`checkout-v2` started crash-looping 14 minutes ago, right after the 1.42 rollout. Memory hits its limit at startup. Rolling back to 1.41 should fix it."),
      {
        t: "approval",
        cmd: "kubectl rollout undo deploy/checkout-v2 -n shop",
        approve: [TOOL("k8s_rollout_undo", "kagent-tool-server"), T("Rolled back. Error rate is back to 0.02%. I opened an issue for the memory limit so 1.42 doesn't ship again as-is.")],
        reject: [T("OK, I'll leave the rollout alone. The other fix is raising the memory limit from 512Mi to 768Mi. Want me to draft that as a pull request instead?")],
      },
    ],
    suggestions: ["show me the failing pods", "what changed in the last hour?", "page the on-call"],
    scripts: [
      { match: /pod|log|fail/i, steps: [TOOL("k8s_get_pods", "kagent-tool-server"), T("3 pods in `shop` aren't healthy:\n• `checkout-v2-7d9f` CrashLoopBackOff (OOMKilled)\n• `checkout-v2-k2lq` CrashLoopBackOff (OOMKilled)\n• `cart-5c8b` Running, 4 restarts in the last hour\nThe cart restarts line up with checkout failing, so they're likely a side effect.")] },
      { match: /chang|deploy|hour|rollout/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), TOOL("query_prometheus", "kagent-grafana-mcp"), T("Two changes in the last hour:\n• 12:31 `checkout-v2` 1.41 → 1.42\n• 12:40 HPA max replicas for `cart` raised from 6 to 10\nThe p99 latency spike starts at 12:33, two minutes after the checkout rollout.")] },
      { match: /page|on.?call|slack|notify/i, steps: [T("I'll post a summary to #incidents and page whoever is on call for checkout."), { t: "approval", cmd: "slack: post to #incidents + page @checkout-oncall", approve: [TOOL("chat_post_message", "slack-mcp"), T("Posted to #incidents and paged Dana (on call for checkout). I'll keep the thread updated.")], reject: [T("No problem, I won't notify anyone yet.")] }] },
    ],
    fallback: [TOOL("k8s_get_resources", "kagent-tool-server"), T("Everything else in `shop` looks healthy. Ask me about pods, recent changes, or who's on call.")],
  },
  {
    id: "pr-reviewer",
    label: "PR Reviewer",
    color: "#f59e0b",
    pool: "kagent-medium",
    preview: "3 comments left on #482. 1 blocking.",
    time: "12:45 PM",
    historyUser: "review #482 please",
    history: [
      TOOL("pull_request_read", "github-mcp"),
      TOOL("get-library-docs", "context7-mcp"),
      T("Left 3 comments on #482. One is blocking: `useEffect` fetches without an abort signal, so a fast route change can set state on an unmounted component. The other two are nits about naming."),
    ],
    suggestions: ["approve it once that's fixed", "is there a security issue?", "summarise the diff"],
    scripts: [
      { match: /approv|merge|lgtm/i, steps: [{ t: "approval", cmd: "github: submit review APPROVE on #482", approve: [TOOL("pull_request_review_write", "github-mcp"), T("Approved #482. The author pushed the abort-signal fix 4 minutes ago.")], reject: [T("Holding the review. I'll re-check when the next commit lands.")] }] },
      { match: /secur|vuln|secret/i, steps: [TOOL("pull_request_read", "github-mcp"), T("No secrets or new dependencies in the diff. The new `/api/export` route does check the session, but it doesn't rate-limit. Worth a follow-up, not a blocker.")] },
      { match: /summar|diff|what/i, steps: [T("#482 adds CSV export to the billing page: a new API route, a download button, and 6 tests. +214 / −31 across 7 files.")] },
    ],
    fallback: [T("I can summarise the PR, look for security issues, or approve it once the blocking comment is fixed.")],
  },
  {
    id: "jira-triage",
    label: "Jira Triage",
    color: "#60a5fa",
    pool: "kagent-default",
    preview: "11 issues triaged, 2 duplicates linked.",
    time: "9:45 AM",
    historyUser: "triage the overnight queue",
    history: [TOOL("jira_search", "atlassian-mcp"), T("Triaged 11 new issues: 4 bugs, 5 feature requests, 2 duplicates (linked to PLAT-881 and PLAT-902). The highest priority is PLAT-1204, login loops on Safari, reported by 3 customers.")],
    suggestions: ["assign PLAT-1204", "what's the oldest open bug?", "any duplicates I missed?"],
    scripts: [
      { match: /assign|1204|owner/i, steps: [TOOL("get_file_contents", "github-mcp"), T("CODEOWNERS says the auth team owns the login flow. Priya fixed the last Safari cookie bug."), { t: "approval", cmd: "jira: assign PLAT-1204 to priya, priority High", approve: [TOOL("jira_update_issue", "atlassian-mcp"), T("Assigned PLAT-1204 to Priya with priority High and linked the old Safari fix for context.")], reject: [T("Left it unassigned.")] }] },
      { match: /old|stale|bug/i, steps: [TOOL("jira_search", "atlassian-mcp"), T("The oldest open bug is PLAT-412, from 214 days ago: CSV export drops unicode characters. Nobody has commented in 3 months.")] },
    ],
    fallback: [T("I can assign issues, find stale bugs, or look for duplicates.")],
  },
  {
    id: "cve-watch",
    label: "CVE Watch",
    color: "#f87171",
    pool: "kagent-default",
    preview: "no new advisories affect you.",
    time: "2:00 AM",
    historyUser: "anything new overnight?",
    history: [TOOL("list_global_security_advisories", "github-mcp"), T("17 new advisories overnight. None affect your dependencies. The closest match is a `golang.org/x/net` issue fixed in 0.38; you're already on 0.41.")],
    suggestions: ["check our Go services", "what about OpenSSL?", "open issues for anything risky"],
    scripts: [
      { match: /go|service/i, steps: [TOOL("ask_question", "deepwiki-mcp"), T("All 9 Go services build with Go 1.26.2, which includes the March stdlib fixes. Nothing to do.")] },
      { match: /openssl|tls|ssl/i, steps: [T("Two base images still ship OpenSSL 3.0.13, which is affected by a moderate advisory. Both are internal tools, not internet-facing.")] },
      { match: /issue|open|risky/i, steps: [{ t: "approval", cmd: "github: open 2 issues for OpenSSL base image upgrades", approve: [TOOL("issue_write", "github-mcp"), T("Opened 2 issues with the fixed image tags and tagged the platform team.")], reject: [T("I won't open anything. I'll mention them in tomorrow's digest instead.")] }] },
    ],
    fallback: [T("Ask me about a language, a library, or a specific CVE ID.")],
  },
  {
    id: "k8s-cost-optimizer",
    label: "Cost Optimizer",
    color: "#a3e635",
    pool: "kagent-medium",
    preview: "PR open: 4 deployments right-sized.",
    time: "6:00 AM",
    historyUser: "where are we wasting money?",
    history: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("4 deployments request more than twice what they use at p95 over 7 days. Right-sizing them saves about $1,840 a month. I opened a pull request with the new requests; nothing changes until it's merged.")],
    suggestions: ["which one is the worst?", "any idle namespaces?", "what's our biggest cost?"],
    scripts: [
      { match: /worst|biggest|most/i, steps: [T("`search-indexer` requests 8 CPU and uses 1.1 at p95. That's about $920 a month on its own.")] },
      { match: /idle|namespace|unused/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), T("`demo-2025` and `perf-test` haven't received traffic in 30 days. Together they hold 14 pods. I'd scale them to zero rather than delete them.")] },
    ],
    fallback: [T("I can find the worst offenders, idle namespaces, or break costs down by team.")],
  },
  {
    id: "docs-librarian",
    label: "Docs Librarian",
    color: "#22d3ee",
    pool: "kagent-medium",
    preview: "answered with 3 citations.",
    time: "8:30 AM",
    historyUser: "how do we rotate the payments API key?",
    history: [TOOL("search", "notion-mcp"), T("Rotate it from the Stripe dashboard, then update the `payments-stripe` secret in Vault; External Secrets syncs it within 5 minutes. Sources: Payments runbook (Notion), Secrets handbook (Notion), and the external-secrets README.")],
    suggestions: ["how does Substrate suspend an agent?", "what's our on-call policy?", "explain A2A"],
    scripts: [
      { match: /substrate|suspend|resume/i, steps: [TOOL("get-library-docs", "context7-mcp"), T("When an agent goes idle, Substrate writes its durable state to a snapshot in object storage and frees the worker. The next message restores it onto any worker with room. Source: kagent docs, Suspend and resume.")] },
      { match: /on.?call|policy/i, steps: [TOOL("search", "notion-mcp"), T("Primary on-call rotates weekly on Mondays at 10:00. You must acknowledge a page within 15 minutes. Source: Engineering handbook, On-call.")] },
      { match: /a2a|agent.to.agent/i, steps: [T("A2A (Agent2Agent) is the open protocol kagent agents use to talk to callers and to each other. Each agent is reachable at `/agents/{namespace}/{name}`. Source: kagent docs, Core concepts.")] },
    ],
    fallback: [T("Ask me anything that's written down somewhere: runbooks, wikis, or library docs.")],
  },
];

const IDLE_MS = 7000;
let nextId = 1;
const id = () => nextId++;

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((p, i) =>
        p.startsWith("`") ? (
          <code key={i} className="rounded bg-white/[0.07] px-1.5 py-0.5 font-geistmono text-[13px] text-white">
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Avatar({ a, size = 32 }: { a: DemoAgent; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-black" style={{ background: a.color, width: size, height: size }}>
      {a.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </span>
  );
}

function seed(a: DemoAgent): Msg[] {
  const out: Msg[] = [];
  if (a.historyUser) out.push({ id: id(), kind: "user", text: a.historyUser });
  for (const s of a.history) {
    if (s.t === "text") out.push({ id: id(), kind: "agent", text: s.text, done: true });
    if (s.t === "tool") out.push({ id: id(), kind: "tool", name: s.name, server: s.server });
    if (s.t === "approval") out.push({ id: id(), kind: "approval", cmd: s.cmd, status: "pending", approve: s.approve, reject: s.reject });
  }
  return out;
}

export default function KagentDemo({
  agents,
  initial = 0,
  bare = false,
  startEmpty = false,
  title,
  onFirstMessage,
}: { agents?: DemoAgent[]; initial?: number; bare?: boolean; startEmpty?: boolean; title?: string; onFirstMessage?: (text: string) => void } = {}) {
  const list = agents ?? DEMO;
  const [active, setActive] = useState(initial);
  const [convos, setConvos] = useState<Msg[][]>(() => list.map((a) => (startEmpty ? [] : seed(a))));
  const [asleep, setAsleep] = useState<boolean[]>(() => list.map((_, i) => i !== initial));
  // source of truth for timers; state mirrors it for rendering
  const asleepRef = useRef<boolean[]>(list.map((_, i) => i !== initial));
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agent = list[active];
  const msgs = convos[active];

  const push = useCallback((ai: number, m: Msg) => setConvos((c) => c.map((list, i) => (i === ai ? [...list, m] : list))), []);
  const patch = useCallback(
    (ai: number, mid: number, fn: (m: Msg) => Msg) => setConvos((c) => c.map((list, i) => (i === ai ? list.map((m) => (m.id === mid ? fn(m) : m)) : list))),
    [],
  );

  // keep the chat scrolled to the newest message (inside the panel, not the page)
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // after a quiet period, Substrate suspends the active agent's actor
  const armIdle = useCallback(
    (ai: number) => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (asleepRef.current[ai]) return;
        asleepRef.current = asleepRef.current.map((v, i) => (i === ai ? true : v));
        setAsleep(asleepRef.current);
        push(ai, { id: id(), kind: "event", text: "idle · actor suspended to snapshot · worker freed" });
      }, IDLE_MS);
    },
    [push],
  );

  useEffect(() => {
    armIdle(active);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [active, armIdle]);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const run = useCallback(
    async (ai: number, steps: Step[]) => {
      for (const s of steps) {
        if (s.t === "tool") {
          await wait(450);
          push(ai, { id: id(), kind: "tool", name: s.name, server: s.server });
        } else if (s.t === "approval") {
          await wait(350);
          push(ai, { id: id(), kind: "approval", cmd: s.cmd, status: "pending", approve: s.approve, reject: s.reject });
        } else {
          await wait(300);
          const mid = id();
          push(ai, { id: mid, kind: "agent", text: "", done: false });
          const words = s.text.split(/(\s+)/);
          let acc = "";
          for (const w of words) {
            acc += w;
            const snapshot = acc;
            patch(ai, mid, (m) => (m.kind === "agent" ? { ...m, text: snapshot } : m));
            await wait(18);
          }
          patch(ai, mid, (m) => (m.kind === "agent" ? { ...m, done: true } : m));
        }
      }
    },
    [patch, push],
  );

  const wake = useCallback(
    async (ai: number) => {
      if (!asleepRef.current[ai]) return;
      const ms = 180 + Math.floor(Math.random() * 320);
      await wait(ms);
      asleepRef.current = asleepRef.current.map((v, i) => (i === ai ? false : v));
      setAsleep(asleepRef.current);
      push(ai, { id: id(), kind: "event", text: `actor resumed from snapshot in ${ms} ms` });
    },
    [push],
  );

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      const ai = active;
      setInput("");
      setBusy(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (!convos[ai].some((m) => m.kind === "user")) onFirstMessage?.(t);
      push(ai, { id: id(), kind: "user", text: t });
      await wake(ai);
      const a = list[ai];
      const script = a.scripts.find((s) => s.match.test(t));
      await run(ai, script ? script.steps : a.fallback);
      setBusy(false);
      armIdle(ai);
    },
    [active, armIdle, busy, convos, list, onFirstMessage, push, run, wake],
  );

  const decide = useCallback(
    async (mid: number, ok: boolean) => {
      const ai = active;
      const m = convos[ai].find((x) => x.id === mid);
      if (!m || m.kind !== "approval" || m.status !== "pending" || busy) return;
      setBusy(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      patch(ai, mid, (x) => (x.kind === "approval" ? { ...x, status: ok ? "approved" : "rejected" } : x));
      await wake(ai);
      await run(ai, ok ? m.approve : m.reject);
      setBusy(false);
      armIdle(ai);
    },
    [active, armIdle, busy, convos, patch, run, wake],
  );

  const lastPreview = (i: number) => {
    const msgsI = convos[i];
    for (let k = msgsI.length - 1; k >= 0; k--) {
      const m = msgsI[k];
      if (m.kind === "agent" && m.text) return m.text.replace(/`/g, "");
    }
    return list[i].preview;
  };

  const suggestionChips = agent.suggestions.map((sg) => (
    <button key={sg} onClick={() => send(sg)} disabled={busy} className="rounded-full border border-ks-line px-3 py-1 text-xs text-ks-muted transition hover:border-white/25 hover:text-white disabled:opacity-40">
      {sg}
    </button>
  ));

  const composer = bare ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
      className="flex items-center gap-2 rounded-xl border border-violet-500/60 bg-[#141319] p-2 shadow-[0_0_48px_-10px_rgba(124,58,237,0.75)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/70" aria-hidden>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8" /></svg>
      </span>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agent something..." className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-[15px] outline-none placeholder:text-white/45" />
      <button type="submit" disabled={busy || !input.trim()} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-white transition disabled:text-white/40">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
        Send
      </button>
    </form>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
      className="flex items-center gap-2 rounded-2xl bg-ks-card2 px-4 py-2"
    >
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${agent.label}`} className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ks-muted" />
      <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-white px-3 py-1 text-sm text-black transition disabled:opacity-30">
        Send
      </button>
    </form>
  );

  return (
    <div className={bare ? "h-full text-left" : "overflow-hidden rounded-[28px] border border-ks-line bg-ks-card text-left shadow-[0_40px_120px_-40px_rgba(167,139,250,0.35)]"}>
      <div className={bare ? "h-full" : "grid md:grid-cols-[280px_1fr]"}>
        {/* sidebar */}
        <div className={bare ? "hidden" : "hidden border-r border-ks-line p-4 md:block"}>
          <div className="mb-4 flex gap-1.5">
            <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <i className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mb-3 rounded-lg bg-ks-card2 px-3 py-2 text-sm text-ks-muted">Search agents</div>
          <div className="space-y-1">
            {list.map((a, i) => (
              <button
                key={a.id}
                onClick={() => !busy && setActive(i)}
                className={`flex w-full gap-3 rounded-xl p-2.5 text-left transition ${i === active ? "bg-ks-card2" : "hover:bg-white/[0.03]"}`}
              >
                <span className="relative">
                  <Avatar a={a} />
                  <span
                    title={asleep[i] ? "suspended" : "running"}
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ks-card ${asleep[i] ? "bg-white/30" : "bg-emerald-400"}`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-sm">
                    <span className="truncate">{a.label}</span>
                    <span className="shrink-0 pl-2 text-[11px] text-ks-muted">{a.time}</span>
                  </span>
                  <span className="block truncate text-xs text-ks-muted">{lastPreview(i)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* chat */}
        <div className={`flex flex-col ${bare ? "h-full" : "h-[600px]"}`}>
          <div className={bare ? "flex items-center justify-end px-5 pt-3" : "flex items-center gap-3 border-b border-ks-line px-5 py-4 md:px-6"}>
            {/* mobile agent picker */}
            <select
              value={active}
              onChange={(e) => !busy && setActive(Number(e.target.value))}
              className={bare ? "hidden" : "rounded-lg bg-ks-card2 px-2 py-1 text-sm md:hidden"}
              aria-label="Choose agent"
            >
              {list.map((a, i) => (
                <option key={a.id} value={i}>{a.label}</option>
              ))}
            </select>
            <span className={bare ? "hidden" : "hidden items-center gap-3 md:flex"}>
              <Avatar a={agent} size={24} />
              <span className="text-sm">{agent.label}</span>
            </span>
            <span className="ml-auto flex items-center gap-2 rounded-full bg-ks-card2 px-2.5 py-1 font-geistmono text-[11px] text-ks-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${asleep[active] ? "bg-white/30" : "bg-emerald-400"}`} />
              <span className="hidden sm:inline">gVisor · {agent.pool} ·</span> {asleep[active] ? "suspended" : "running"}
            </span>
          </div>

          {bare && msgs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
              <div className="text-lg">{title ?? agent.id}</div>
              <div className="mt-2 text-sm text-white/60">Send a message to start a new conversation.</div>
              <div className="mt-10 w-full max-w-xl">{composer}</div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">{suggestionChips}</div>
            </div>
          ) : (
            <>
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 text-[15px] md:px-6">
              {msgs.map((m) => {
                if (m.kind === "user")
                  return (
                    <div key={m.id} className="ml-auto w-fit max-w-md rounded-2xl rounded-br-md bg-ks-card2 px-4 py-3">
                      {m.text}
                    </div>
                  );
                if (m.kind === "agent")
                  return (
                    <div key={m.id} className="max-w-lg whitespace-pre-line leading-relaxed text-white/85">
                      <Inline text={m.text} />
                      {!m.done && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-white/60 align-middle" />}
                    </div>
                  );
                if (m.kind === "tool")
                  return (
                    <div key={m.id} className="flex w-fit items-center gap-2 rounded-full border border-ks-line px-3 py-1 font-geistmono text-[11.5px] text-ks-muted">
                      <span className="text-ks-accent">⚙</span> {m.name} <span className="text-white/30">· {m.server}</span>
                    </div>
                  );
                if (m.kind === "approval")
                  return (
                    <div key={m.id} className="max-w-lg rounded-2xl border border-ks-line bg-ks-bg p-4">
                      <div className="text-xs text-ks-muted">
                        {m.status === "pending" ? "Approval needed" : m.status === "approved" ? "Approved by you" : "Rejected by you"}
                      </div>
                      <div className="mt-1 break-words font-geistmono text-sm">{m.cmd}</div>
                      {m.status === "pending" ? (
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => decide(m.id, true)} disabled={busy} className="rounded-full bg-white px-4 py-1.5 text-sm text-black transition hover:bg-white/85 disabled:opacity-50">
                            Approve
                          </button>
                          <button onClick={() => decide(m.id, false)} disabled={busy} className="rounded-full bg-ks-card2 px-4 py-1.5 text-sm transition hover:bg-white/15 disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className={`mt-3 text-sm ${m.status === "approved" ? "text-emerald-400" : "text-red-400"}`}>
                          {m.status === "approved" ? "✓ approved" : "✕ rejected"}
                        </div>
                      )}
                    </div>
                  );
                return (
                  <div key={m.id} className="flex items-center gap-3 font-geistmono text-[11px] text-ks-muted">
                    <span className="h-px flex-1 bg-ks-line" />
                    {m.text}
                    <span className="h-px flex-1 bg-ks-line" />
                  </div>
                );
              })}
              {busy && msgs[msgs.length - 1]?.kind === "user" && (
                <div className="font-geistmono text-[12px] text-ks-muted">{asleep[active] ? "resuming actor…" : "thinking…"}</div>
              )}
            </div>

              <div className="px-4 pb-4">
                <div className="mb-2 flex flex-wrap gap-2">{suggestionChips}</div>
                {composer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

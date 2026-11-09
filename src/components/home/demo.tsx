"use client";

/*
 * Interactive kagent chat demo. Everything is scripted and runs in the
 * browser; no cluster is involved. It mimics real kagent + Substrate
 * behaviour: MCP tool calls, human-in-the-loop approvals, and actors that
 * suspend to a snapshot when idle and resume on the next message.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type Step =
  | { t: "text"; text: string }
  | { t: "user"; text: string }
  | { t: "event"; text: string }
  | { t: "tool"; name: string; server: string }
  | { t: "approval"; cmd: string; approve: Step[]; reject: Step[]; status?: "approved" | "rejected" };

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

/* A finished conversation shown in an agent's chat list. */
export type PastChat = { title: string; when: string; history: Step[] };

const T = (text: string): Step => ({ t: "text", text });
const U = (text: string): Step => ({ t: "user", text });
const E = (text: string): Step => ({ t: "event", text });
const TOOL = (name: string, server: string): Step => ({ t: "tool", name, server });
/* another kagent agent called over A2A */
const A2A = (agent: string): Step => ({ t: "tool", name: agent, server: "a2a" });
const ASK = (cmd: string, approve: Step[], reject: Step[], status?: "approved" | "rejected"): Step => ({ t: "approval", cmd, approve, reject, status });

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
      TOOL("query_prometheus", "kagent-grafana-mcp"),
      T("`checkout-v2` started crash-looping at 12:33, two minutes after the 1.42 rollout. The pods are OOMKilled on startup: 1.42 warms the whole product catalog into memory and peaks at 610Mi against a 512Mi limit.\n• 502 rate: 0.02% → 18.4%\n• p99 latency: 240ms → 3.1s\n• 2 of 3 checkout pods down\nRolling back to 1.41 is the fastest fix."),
      U("how many customers are hitting this?"),
      TOOL("query_loki_logs", "kagent-grafana-mcp"),
      T("1,240 failed checkout attempts in the last 14 minutes from 890 sessions, about $38k in carts. Retries land on the one healthy pod roughly a third of the time, so some customers are getting through on the second or third try."),
      U("ok roll it back"),
      ASK(
        "kubectl rollout undo deploy/checkout-v2 -n shop",
        [TOOL("k8s_rollout_undo", "kagent-tool-server"), TOOL("query_prometheus", "kagent-grafana-mcp"), T("Rolled back to 1.41. All 3 pods are Ready and the 502 rate is back to 0.02%. I opened SHOP-2291 for the memory limit so 1.42 doesn't ship again as-is.")],
        [T("OK, I'll leave the rollout alone. The other fix is raising the memory limit from 512Mi to 768Mi. Want me to draft that as a pull request instead?")],
      ),
    ],
    suggestions: ["show me the failing pods", "what changed in the last hour?", "page the on-call", "draft the postmortem"],
    scripts: [
      { match: /pod|log|fail/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), TOOL("k8s_get_pod_logs", "kagent-tool-server"), T("3 pods in `shop` aren't healthy:\n• `checkout-v2-7d9f` CrashLoopBackOff, OOMKilled 6 times\n• `checkout-v2-k2lq` CrashLoopBackOff, OOMKilled 5 times\n• `cart-5c8b` Running, 4 restarts in the last hour\nLast log line before each kill: `warming catalog cache: 48,211 SKUs`. The cart restarts line up with checkout failing, so they're a side effect: cart times out waiting on checkout and its liveness probe gives up.")] },
      { match: /chang|deploy|hour|rollout/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), TOOL("query_prometheus", "kagent-grafana-mcp"), T("Two changes in the last hour:\n• 12:31 `checkout-v2` 1.41 → 1.42 (Argo CD sync by @marco)\n• 12:40 HPA max replicas for `cart` raised from 6 to 10\nThe p99 spike starts at 12:33, two minutes after the checkout rollout. The HPA change came after, probably someone trying to absorb the errors.")] },
      { match: /page|on.?call|slack|notify/i, steps: [T("I'll post a summary to #incidents and page whoever is on call for checkout."), ASK("slack: post to #incidents + page @checkout-oncall", [TOOL("slack_post_message", "slack-mcp"), T("Posted to #incidents and paged Dana (on call for checkout). She acknowledged in 40 seconds. I'll keep the thread updated as things change.")], [T("No problem, I won't notify anyone yet.")])] },
      { match: /postmortem|post.mortem|timeline|write.?up|rca/i, steps: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("Draft postmortem, SEV-2, checkout 502s:\n\nTimeline\n• 12:31 1.42 rolled out\n• 12:33 first OOMKill, 502s climb to 18%\n• 12:41 alert fires, Incident Commander starts triage\n• 12:47 rollback approved and applied\n• 12:49 error rate back to baseline\n\nRoot cause: 1.42 warms the catalog cache on startup and needs ~610Mi; the limit stayed at 512Mi.\n\nAction items\n• Load test new releases with production catalog size\n• Alert on OOMKills during rollouts, not just on 5xx\n\nWant me to save it to Notion?")] },
      { match: /memory|limit|fix.?forward|768/i, steps: [TOOL("get_file_contents", "github-mcp"), T("The limit lives in `deploy/checkout/values.yaml`. I'd raise it to 768Mi and the request to 640Mi, which leaves 25% headroom over the startup peak."), ASK("github: open PR 'checkout: raise memory limit to 768Mi' on acme/shop-deploy", [TOOL("create_pull_request", "github-mcp"), T("Opened acme/shop-deploy#911. Once it merges, 1.42 can roll out again. I'll watch the first pods come up.")], [T("OK, no PR. The rollback holds for now.")])] },
      { match: /status|now|health|recover|ok\??$/i, steps: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("All quiet. 3 of 3 `checkout-v2` pods Ready on 1.41, 502 rate 0.02%, p99 230ms. No OOMKills since 12:47.")] },
    ],
    fallback: [TOOL("k8s_get_resources", "kagent-tool-server"), T("Everything else in `shop` looks healthy. Ask me about pods, recent changes, who's on call, or have me draft the postmortem.")],
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
      T("Reviewed #482, \"Add CSV export to billing\": +214 / −31 across 7 files. I left 3 comments:\n• Blocking, `BillingExport.tsx:48`: `useEffect` fetches without an `AbortController`, so a fast route change sets state on an unmounted component. The current React docs show returning `() => controller.abort()` from the effect.\n• Nit, `exportRows` should be `toCsvRows`, since it returns rows, not a file.\n• Nit, `formatCents` duplicates `lib/money.ts`."),
      U("does it pass CI?"),
      TOOL("actions_list", "github-mcp"),
      TOOL("get_job_logs", "github-mcp"),
      T("5 of 6 checks pass. `e2e-billing` fails at `export.spec.ts:22`: the download assertion times out on WebKit only. It's flaky on `main` too (3 failures in the last 20 runs), so this PR didn't cause it."),
      U("is the CSV streaming or built in memory?"),
      TOOL("get_file_contents", "github-mcp"),
      T("Built in memory. `exportInvoices()` loads every invoice for the account, then joins the rows. The largest account has 61,000 invoices, which works out to about 40MB per request. Streaming with `ReadableStream` would keep it flat. I added that as a non-blocking comment."),
      U("ok, ping the author about the blocking one"),
      ASK(
        "github: comment on #482 mentioning @tomasz",
        [TOOL("add_issue_comment", "github-mcp"), T("Commented on #482: \"@tomasz the abort-signal fix on line 48 is the only thing blocking. Happy to approve once it's in.\"")],
        [T("No comment posted.")],
        "approved",
      ),
    ],
    suggestions: ["approve it once that's fixed", "is there a security issue?", "suggest the fix", "summarise the diff"],
    scripts: [
      { match: /approv|merge|lgtm/i, steps: [TOOL("pull_request_read", "github-mcp"), T("The author pushed `fix: abort export fetch on unmount` 4 minutes ago, and the blocking comment is resolved."), ASK("github: submit review APPROVE on #482", [TOOL("pull_request_review_write", "github-mcp"), T("Approved #482. I left the two nits as non-blocking suggestions.")], [T("Holding the review. I'll re-check when the next commit lands.")])] },
      { match: /secur|vuln|secret/i, steps: [TOOL("pull_request_read", "github-mcp"), TOOL("list_code_scanning_alerts", "github-mcp"), T("No secrets and no new dependencies in the diff, and code scanning is clean. Two things worth a follow-up, neither blocking:\n• `/api/export` checks the session but doesn't rate-limit. A script could pull every invoice in a loop.\n• The CSV doesn't escape cells that start with `=`, `+` or `@`, so a customer name could become a formula in Excel. Prefixing those with `'` fixes it.")] },
      { match: /fix|suggest|patch|how/i, steps: [T("For the blocking comment, the effect should look like this:\n\n`const controller = new AbortController();`\n`fetch(url, { signal: controller.signal }).then(setRows);`\n`return () => controller.abort();`\n\nI can post it as a suggested change on line 48 so the author can apply it in one click."), ASK("github: add suggested change on BillingExport.tsx:48", [TOOL("add_comment_to_pending_review", "github-mcp"), T("Posted the suggestion on line 48.")], [T("Skipped. The comment already explains it.")])] },
      { match: /summar|diff|what/i, steps: [T("#482 adds CSV export to the billing page:\n• `GET /api/export` streams invoices for the signed-in account\n• a Download button on `/billing`\n• 6 new tests, 1 of them e2e\n+214 / −31 across 7 files. The risky part is the API route; the UI change is small.")] },
    ],
    fallback: [T("I can summarise the PR, look for security issues, suggest the fix for the blocking comment, or approve it once that's done.")],
  },
  {
    id: "jira-triage",
    label: "Jira Triage",
    color: "#60a5fa",
    pool: "kagent-default",
    preview: "11 issues triaged, 2 duplicates linked.",
    time: "9:45 AM",
    historyUser: "triage the overnight queue",
    history: [
      TOOL("jira_search", "atlassian-mcp"),
      TOOL("search_code", "github-mcp"),
      T("Triaged 11 new issues: 4 bugs, 5 feature requests, 2 duplicates.\n• PLAT-1204, login loops on Safari 18: High, 3 customers reported it\n• PLAT-1207, CSV export drops the last row: Medium, repro attached\n• PLAT-1209, dark mode for the admin console: feature, 14 votes\n• PLAT-1211 and PLAT-1213: duplicates of PLAT-881 and PLAT-902, linked and closed\nPLAT-1204 needs an owner today."),
      U("why do you think 1204 is High?"),
      TOOL("jira_get_issue", "atlassian-mcp"),
      T("Three reasons:\n• 3 paying customers reported it overnight, 2 of them on the Enterprise plan\n• It blocks login completely, there's no workaround besides switching browser\n• Safari is 22% of your logins last month\nIf it were one free-tier user I'd have said Medium."),
      U("what changed in auth recently?"),
      TOOL("list_commits", "github-mcp"),
      T("`auth-service` shipped 1.19 on Tuesday. One commit stands out: \"tighten session cookie flags\" (a41c9e2) changed `SameSite` from `None` to `Lax`. Safari treats the SSO redirect as cross-site, so the cookie never comes back. That's very likely the bug."),
    ],
    suggestions: ["assign PLAT-1204", "what's the oldest open bug?", "any duplicates I missed?", "plan next sprint"],
    scripts: [
      { match: /assign|1204|owner/i, steps: [TOOL("get_file_contents", "github-mcp"), TOOL("jira_search", "atlassian-mcp"), T("CODEOWNERS puts the login flow with the auth team. Priya fixed the last Safari cookie bug (PLAT-977), and it's the same `SameSite=None` area. She has 3 issues in progress."), ASK("jira: assign PLAT-1204 to priya, priority High", [TOOL("jira_update_issue", "atlassian-mcp"), T("Assigned PLAT-1204 to Priya with priority High and linked PLAT-977 for context.")], [T("Left it unassigned.")])] },
      { match: /old|stale|bug/i, steps: [TOOL("jira_search", "atlassian-mcp"), T("The oldest open bug is PLAT-412, from 214 days ago: CSV export drops unicode characters. Nobody has commented in 3 months. It's probably related to PLAT-1207 from last night, since both are in `export/csv.ts`. Want me to link them?")] },
      { match: /dup|missed|similar/i, steps: [TOOL("jira_search", "atlassian-mcp"), T("One more likely duplicate: PLAT-1210, \"session expires too quickly on iPad\", reads like PLAT-1204 from a different angle. Same Safari engine, same cookie. I'd link it rather than close it until Priya confirms.")] },
      { match: /sprint|plan|next/i, steps: [TOOL("jira_search", "atlassian-mcp"), T("Suggested for next sprint, about 21 points:\n• PLAT-1204 Safari login loop (5)\n• PLAT-1207 + PLAT-412 CSV export fixes (5)\n• PLAT-1188 rate-limit `/api/export` (3)\n• PLAT-1209 admin dark mode (8)\nThat leaves room for on-call interrupts at your usual velocity of 26.")] },
    ],
    fallback: [T("I can assign issues, find stale bugs, look for duplicates, or suggest a sprint plan.")],
  },
  {
    id: "cve-watch",
    label: "CVE Watch",
    color: "#f87171",
    pool: "kagent-default",
    preview: "no new advisories affect you.",
    time: "2:00 AM",
    historyUser: "anything new overnight?",
    history: [
      TOOL("list_global_security_advisories", "github-mcp"),
      TOOL("list_dependabot_alerts", "github-mcp"),
      T("17 new advisories overnight across Go, npm and PyPI. None reach your code:\n• `golang.org/x/net` HTTP/2 issue: fixed in 0.38, you're on 0.41\n• `axios` SSRF: only in 0.x, all 6 frontends use 1.8\n• `jinja2` sandbox escape: only `docs-builder` uses jinja2, and it never renders user input\nNothing to patch today."),
    ],
    suggestions: ["check our Go services", "what about OpenSSL?", "open issues for anything risky", "look up CVE-2026-31337"],
    scripts: [
      { match: /cve-\d|look ?up/i, steps: [TOOL("get_global_security_advisory", "github-mcp"), TOOL("search_code", "github-mcp"), T("CVE-2026-31337 is a high-severity path traversal in `tar-fs` before 3.0.9: a crafted archive can write outside the extract directory.\nYou have it in 2 places:\n• `release-tools`, 3.0.6, direct dependency\n• `web-console`, 2.1.1, pulled in by `puppeteer`\nOnly `release-tools` extracts archives you don't control. That one is worth patching this week.")] },
      { match: /go|service/i, steps: [TOOL("search_code", "github-mcp"), TOOL("ask_question", "deepwiki-mcp"), T("All 9 Go services build with Go 1.26.2, which includes the March stdlib fixes for `net/http` and `crypto/x509`. Nothing to do.")] },
      { match: /openssl|tls|ssl/i, steps: [TOOL("search_code", "github-mcp"), T("Two base images still ship OpenSSL 3.0.13, which a moderate advisory affects:\n• `ghcr.io/acme/tools-base:2024.11`\n• `ghcr.io/acme/batch-runner:1.4`\nBoth are internal tools, not internet-facing. Bumping to the `2026.10` base fixes both.")] },
      { match: /issue|open|risky/i, steps: [ASK("github: open 2 issues for OpenSSL base image upgrades", [TOOL("issue_write", "github-mcp"), T("Opened acme/tools-base#212 and acme/batch-runner#88 with the fixed image tags, and tagged @platform-team.")], [T("I won't open anything. I'll mention them in tomorrow's digest instead.")])] },
    ],
    fallback: [T("Ask me about a language, a library, a base image, or a specific CVE ID.")],
  },
  {
    id: "k8s-cost-optimizer",
    label: "Cost Optimizer",
    color: "#a3e635",
    pool: "kagent-medium",
    preview: "PR open: 4 deployments right-sized.",
    time: "6:00 AM",
    historyUser: "where are we wasting money?",
    history: [
      TOOL("query_prometheus", "kagent-grafana-mcp"),
      TOOL("k8s_get_resources", "kagent-tool-server"),
      T("4 deployments request more than twice what they use at p95 over 7 days:\n• `search-indexer`: 8 CPU requested, 1.1 used, $920/mo\n• `report-worker`: 16Gi requested, 4.2Gi used, $410/mo\n• `image-resizer`: 4 CPU requested, 0.6 used, $330/mo\n• `notifications`: 6 replicas, never more than 2 busy, $180/mo\nRight-sizing them saves about $1,840 a month."),
      U("do it, but don't touch prod directly"),
      ASK(
        "github: open PR 'right-size 4 deployments' on acme/platform-config",
        [TOOL("create_pull_request", "github-mcp"), T("Opened acme/platform-config#1377 with the new requests, each at p95 plus 30% headroom. Nothing changes until it's merged and Argo CD syncs it.")],
        [T("OK, no PR. I'll include the numbers in Monday's report.")],
        "approved",
      ),
      U("what's the risk if search-indexer gets throttled?"),
      TOOL("query_prometheus", "kagent-grafana-mcp"),
      T("Low. It's a background consumer, so throttling just makes the queue drain slower. At 2 CPU the nightly reindex would take about 70 minutes instead of 25, still well before the 06:00 traffic ramp. I set the limit at 4 CPU so the reindex can burst."),
      U("tell #platform-cost about the PR"),
      ASK(
        "slack: post PR summary to #platform-cost",
        [TOOL("slack_post_message", "slack-mcp"), T("Posted a summary with the $1,840/mo estimate and a link to #1377. @rachel from search reacted with a thumbs up.")],
        [T("Not posted.")],
        "approved",
      ),
    ],
    suggestions: ["which one is the worst?", "any idle namespaces?", "break it down by team", "what about GPUs?"],
    scripts: [
      { match: /worst|biggest|most/i, steps: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("`search-indexer`. It requests 8 CPU and uses 1.1 at p95, with a short spike to 3.4 during the nightly reindex at 02:00. That's about $920 a month on its own. A CronJob for the reindex plus 2 CPU for the steady state would cover it.")] },
      { match: /idle|namespace|unused/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), TOOL("query_prometheus", "kagent-grafana-mcp"), T("`demo-2025` and `perf-test` haven't received traffic in 30 days. Together they hold 14 pods and 3 PVCs, about $610 a month. I'd scale them to zero rather than delete them; the PVCs keep the data."), ASK("kubectl scale deploy --all --replicas=0 -n demo-2025 -n perf-test", [TOOL("k8s_apply_manifest", "kagent-tool-server"), T("Scaled both namespaces to zero and annotated them with today's date, so it's clear why.")], [T("Leaving them running.")])] },
      { match: /team|break.?down|who/i, steps: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("Last 30 days by `team` label:\n• search: $14,200 (31%)\n• payments: $9,800 (21%)\n• data: $8,900 (19%)\n• web: $6,100 (13%)\n• unlabelled: $7,300 (16%)\nThe unlabelled share is the real problem: most of it is in `default` and `tmp-*` namespaces nobody claims.")] },
      { match: /gpu/i, steps: [TOOL("query_prometheus", "kagent-grafana-mcp"), T("You run 6 L4 GPUs in the `ml` pool. Average utilisation is 23%, and 4 of them sat at 0% for the last 3 nights. Time-slicing 2 workloads per GPU, or scaling the pool down overnight, would save about $2,100 a month.")] },
    ],
    fallback: [T("I can find the worst offenders, idle namespaces, GPU waste, or break costs down by team.")],
  },
  {
    id: "docs-librarian",
    label: "Docs Librarian",
    color: "#22d3ee",
    pool: "kagent-medium",
    preview: "answered with 3 citations.",
    time: "8:30 AM",
    historyUser: "how do we rotate the payments API key?",
    history: [
      TOOL("notion-search", "notion-mcp"),
      TOOL("read_wiki_contents", "deepwiki-mcp"),
      T("1. Create a new restricted key in the Stripe dashboard with the same scopes.\n2. Write it to Vault at `secret/payments/stripe` (key `api_key`).\n3. External Secrets syncs the `payments-stripe` secret within 5 minutes; the pods pick it up without a restart.\n4. Once the error rate looks normal for 30 minutes, roll the old key in Stripe.\nSources: Payments runbook (Notion), Secrets handbook (Notion), external-secrets README."),
      U("who's allowed to do that?"),
      TOOL("notion-fetch", "notion-mcp"),
      T("Anyone in the `payments-oncall` group, with a second person from that group approving the Vault write. It's a two-person rule since the 2025 audit. Source: Secrets handbook, Access."),
      U("when did we last rotate it?"),
      TOOL("notion-query-database", "notion-mcp"),
      T("Aug 14, by Sam and Ade, according to the Key rotation log. The policy says every 90 days, so it's due on Nov 12, five days from now."),
    ],
    suggestions: ["how does Agent Substrate suspend an agent?", "what's our on-call policy?", "explain A2A", "how do we fail over Postgres?"],
    scripts: [
      { match: /substrate|suspend|resume/i, steps: [TOOL("get-library-docs", "context7-mcp"), T("When an agent goes idle, Agent Substrate snapshots its sandbox (memory and filesystem) to object storage and frees the worker. The next message restores the snapshot onto any worker with room, in as little as 150ms. The conversation carries on as if nothing happened. Source: kagent docs, Suspend and resume.")] },
      { match: /on.?call|policy/i, steps: [TOOL("notion-search", "notion-mcp"), T("Primary on-call rotates weekly on Mondays at 10:00. You must acknowledge a page within 15 minutes and hand over in #oncall with open incidents listed. Secondary takes over after 30 minutes of no ack. Source: Engineering handbook, On-call.")] },
      { match: /a2a|agent.to.agent/i, steps: [TOOL("get-library-docs", "context7-mcp"), T("A2A (Agent2Agent) is the open protocol kagent agents use to talk to callers and to each other. Each agent publishes an agent card with its skills and is reachable at `/api/a2a/{namespace}/{name}`. That's how `platform-orchestrator` hands work to the other agents here. Source: kagent docs, Core concepts.")] },
      { match: /postgres|database|failover|db/i, steps: [TOOL("notion-search", "notion-mcp"), T("Postgres runs on CloudNativePG with one primary and two replicas per cluster. To fail over: `kubectl cnpg promote orders-db orders-db-2`, then check that `orders-db-rw` points at the new primary. Writes pause for about 10 seconds. Source: Databases runbook (Notion), last updated 6 weeks ago.")] },
    ],
    fallback: [TOOL("notion-search", "notion-mcp"), T("I couldn't find that written down anywhere. Ask me about runbooks, policies, or library docs, and I'll cite the source.")],
  },
  {
    id: "billing-ops",
    label: "Billing Ops",
    color: "#c084fc",
    pool: "kagent-high",
    preview: "refund ready for Northwind, needs approval.",
    time: "11:20 AM",
    historyUser: "Northwind says they were charged twice this month",
    history: [
      TOOL("list_customers", "stripe-mcp"),
      TOOL("list_invoices", "stripe-mcp"),
      TOOL("search_events", "sentry-mcp"),
      T("They were. Northwind Traders (`cus_Q8x2…`) has two paid invoices for November, both $4,800:\n• `in_1PdA…` paid Nov 1, 09:02\n• `in_1PdB…` paid Nov 1, 09:03\nSentry shows the cause: the renewal webhook timed out at 30s and Stripe retried it, and our handler isn't idempotent, so it created a second invoice."),
      U("can you tell how long this has been happening?"),
      TOOL("find_issues", "sentry-mcp"),
      T("Since Oct 28. That's when the renewal handler moved to the new queue, and webhook p99 went from 4s to 34s. Before that, Stripe never had to retry. 4 customers were double-charged in total, all on Nov 1."),
      U("refund Northwind first, they're waiting"),
      ASK(
        "stripe: refund $4,800.00 on in_1PdB… (duplicate charge)",
        [TOOL("create_refund", "stripe-mcp"), T("Refunded $4,800 on the duplicate invoice. It reaches their card in 5 to 10 business days. I drafted a short apology for their account manager.")],
        [T("No refund issued. Want me to apply it as account credit for next month instead?")],
      ),
    ],
    suggestions: ["did this hit anyone else?", "why did payments fail yesterday?", "what's our balance?"],
    scripts: [
      { match: /anyone|else|other|who/i, steps: [TOOL("find_issues", "sentry-mcp"), TOOL("list_invoices", "stripe-mcp"), T("Yes, 3 more customers got duplicate renewals from the same webhook timeouts on Nov 1:\n• Contoso, $1,200\n• Fabrikam, $350\n• Tailspin, $350\nTotal $1,900. The fix is to key the handler on the Stripe event ID. Sentry issue BILLING-3F2 has the stack trace.")] },
      { match: /fail|declin|yesterday/i, steps: [TOOL("search_events", "sentry-mcp"), TOOL("list_subscriptions", "stripe-mcp"), T("42 payments failed yesterday, against a normal 15:\n• 31 `card_declined` from one issuing bank between 14:00 and 15:10, matching their reported outage\n• 8 `expired_card`\n• 3 `insufficient_funds`\nStripe's smart retries will try the bank-outage ones again tonight. Nothing on our side broke.")] },
      { match: /balance|payout/i, steps: [TOOL("retrieve_balance", "stripe-mcp"), T("Available: $182,440.12. Pending: $56,910.00, landing over the next 2 days. Next payout of $182,440 is scheduled for tomorrow.")] },
    ],
    fallback: [T("I can look into charges, refunds, failed payments, or the balance. Every write to Stripe waits for your approval.")],
  },
  {
    id: "design-to-code",
    label: "Design to Code",
    color: "#f472b6",
    pool: "kagent-high",
    preview: "PR #1520 open: PricingCard component.",
    time: "Mon",
    historyUser: "build the new pricing card from Figma",
    history: [
      TOOL("get_design_context", "figma-mcp"),
      TOOL("get_variable_defs", "figma-mcp"),
      TOOL("get_file_contents", "github-mcp"),
      T("Read the \"Pricing / Card\" frame: 3 variants (Free, Team, Enterprise), each with a highlighted state. Every color and spacing value maps to an existing token in `@acme/tokens`, so there's no new CSS.\nI built `PricingCard.tsx` with a `tier` and `highlighted` prop, reused `Button` and `Badge`, and added a Storybook story for each variant."),
      ASK(
        "github: open PR 'feat: PricingCard component' on acme/web",
        [TOOL("create_pull_request", "github-mcp"), T("Opened acme/web#1520 with screenshots of all 6 states next to the Figma frames.")],
        [T("Kept it on the branch `agent/pricing-card` without a PR.")],
        "approved",
      ),
      U("the Team card should say 'Most popular'"),
      TOOL("get_design_context", "figma-mcp"),
      T("It does in Figma, as a `Badge` in the top-right corner, but the label was a text layer outside the component, so I missed it. Added a `badge` prop, set it to \"Most popular\" on Team, and pushed the fix to #1520."),
      U("does it work in dark mode?"),
      TOOL("get_variable_defs", "figma-mcp"),
      T("Yes. Every color comes from a semantic token (`surface`, `text-primary`, `accent`), and Figma has a dark mode for each one, so the card switches with the theme. I added dark variants to the Storybook stories and the screenshots on the PR."),
    ],
    suggestions: ["how close is it to the design?", "make it responsive", "does it pass accessibility checks?"],
    scripts: [
      { match: /close|match|diff|pixel/i, steps: [TOOL("get_screenshot", "figma-mcp"), T("Within 1px everywhere except the Enterprise badge, which sits 2px higher in Figma because the frame uses a 13px font that isn't in the type scale. I used the 12px token and left a comment on the PR asking design whether 13px is intentional.")] },
      { match: /responsive|mobile|breakpoint/i, steps: [TOOL("get_design_context", "figma-mcp"), T("The Figma file has a 375px version too. Below `md` the cards stack, the feature list collapses to the first 4 items with a \"Show all\" toggle, and the CTA goes full width. Pushed that to #1520 as a second commit.")] },
      { match: /a11y|accessib|contrast|wcag/i, steps: [T("axe reports no violations. Two things I fixed by hand:\n• The highlighted card's grey text was 4.1:1 on violet, so I used `text-muted-strong` to reach 4.6:1\n• The price is now read as \"$29 per user per month\" instead of \"$29 /u/mo\"")] },
    ],
    fallback: [T("Point me at a Figma frame and I'll build it with your design system, or ask how the pricing card compares to the design.")],
  },
  {
    id: "release-notes-writer",
    label: "Release Notes",
    color: "#fb923c",
    pool: "kagent-default",
    preview: "v2.8 notes drafted from 37 PRs.",
    time: "Fri",
    historyUser: "draft the notes for v2.8",
    history: [
      TOOL("list_pull_requests", "github-mcp"),
      TOOL("list_issues", "linear-mcp"),
      T("v2.8 has 37 merged PRs since v2.7. I grouped them:\n\nNew\n• CSV export on the billing page\n• SSO with Okta SCIM provisioning\n• Dark mode for the admin console\n\nFixed\n• Login loop on Safari 18\n• Checkout timeouts under heavy load\n\n19 PRs are internal (CI, refactors, dependency bumps), so I left them out. Two PRs have no Linear issue: #1490 and #1502."),
    ],
    suggestions: ["post it to #releases", "make it shorter for customers", "who contributed?"],
    scripts: [
      { match: /post|slack|share|publish/i, steps: [ASK("slack: post v2.8 release notes to #releases", [TOOL("slack_post_message", "slack-mcp"), T("Posted to #releases and threaded the full PR list under it.")], [T("Not posted. The draft is still here when you're ready.")])] },
      { match: /short|customer|tweet|brief/i, steps: [T("v2.8 is out: export billing history to CSV, provision users from Okta, and switch the admin console to dark mode. Safari users won't get stuck at login anymore.")] },
      { match: /contribut|who|thank/i, steps: [TOOL("list_pull_requests", "github-mcp"), T("14 people merged PRs into v2.8, including 3 first-time contributors: @lena-k, @ojo and @fmartins. Want me to add a thanks section?")] },
    ],
    fallback: [T("I can post the notes, write a shorter customer version, or list who contributed.")],
  },
  {
    id: "platform-orchestrator",
    label: "Platform Orchestrator",
    color: "#e879f9",
    pool: "kagent-high",
    preview: "weekly platform report, 4 agents consulted.",
    time: "Mon",
    historyUser: "give me the weekly platform report",
    history: [
      A2A("sre-incident-commander"),
      A2A("k8s-cost-optimizer"),
      A2A("jira-triage"),
      A2A("cve-watch"),
      T("Week of Nov 2, from 4 agents:\n• Reliability: 1 SEV-2 (checkout 502s, 16 minutes, rolled back). 99.97% availability.\n• Cost: $1,840/mo of right-sizing in review in platform-config#1377.\n• Backlog: 11 new issues, PLAT-1204 (Safari login) is the top priority.\n• Security: no advisories affect you. 2 internal images need an OpenSSL bump.\nNothing needs your decision except merging #1377."),
      U("what happened with the SEV-2?"),
      A2A("sre-incident-commander"),
      T("Checkout 1.42 ran out of memory on startup and served 502s to about 18% of requests for 16 minutes. Incident Commander found it, you approved the rollback, and a PR to raise the memory limit is open (shop-deploy#911). The postmortem draft is in that agent's chat."),
      U("and the cost PR, is it safe to merge?"),
      A2A("k8s-cost-optimizer"),
      A2A("sre-incident-commander"),
      T("Yes, with one caveat. Cost Optimizer says every new request is p95 plus 30% headroom. Incident Commander checked them against this week's peaks and found no workload that would have hit the new limits. The caveat: `report-worker` runs month-end jobs, so merge it after Dec 1 or keep its memory where it is."),
    ],
    suggestions: ["is the cluster ready for Black Friday?", "who should look at PLAT-1204?", "what's the single biggest risk?"],
    scripts: [
      { match: /black friday|ready|peak|load/i, steps: [A2A("sre-incident-commander"), A2A("k8s-cost-optimizer"), T("Mostly. Incident Commander says checkout handled 3.2x normal traffic in last week's load test, but `cart` hit its HPA max at 2.5x. Cost Optimizer says raising `cart` to 16 replicas for the weekend costs about $140. My recommendation: raise it, and keep the 1.42 checkout release out until the memory fix ships.")] },
      { match: /1204|who should|owner/i, steps: [A2A("jira-triage"), T("Jira Triage already suggested Priya, who fixed the last Safari cookie bug. It's waiting on your approval in that agent's chat.")] },
      { match: /risk|worry|concern/i, steps: [A2A("sre-incident-commander"), A2A("cve-watch"), T("The 1.42 checkout release. It's still in the deploy queue with the memory limit that caused this week's SEV-2. If someone re-syncs Argo CD before acme/shop-deploy#911 merges, it breaks again.")] },
    ],
    fallback: [T("I route platform questions to the right specialist agent over A2A and combine the answers. Try asking about readiness, risks, or a specific issue.")],
  },
  {
    id: "model-scout",
    label: "Model Scout",
    color: "#facc15",
    pool: "kagent-default",
    preview: "3 open models shortlisted for ticket routing.",
    time: "Thu",
    historyUser: "find an open model to classify support tickets",
    history: [
      TOOL("model_search", "huggingface-mcp"),
      TOOL("dataset_search", "huggingface-mcp"),
      T("Shortlist for routing support tickets into ~20 categories:\n• `Qwen/Qwen3-8B`: strongest zero-shot, fits one L4 at 8-bit\n• `answerdotai/ModernBERT-large`: fine-tune it, fastest at under 10ms per ticket\n• `microsoft/Phi-4-mini-instruct`: good middle ground with an MIT license\nFor 20 fixed categories I'd fine-tune ModernBERT on your labelled tickets. There's also a public 120k-ticket dataset to pre-train on."),
    ],
    suggestions: ["how much would it cost to run?", "any papers on this?", "compare licenses"],
    scripts: [
      { match: /cost|run|gpu|serve/i, steps: [T("ModernBERT runs on CPU: 2 pods with 2 vCPU each handle about 200 tickets a second, roughly $60 a month. Qwen3-8B needs a GPU: one L4 around the clock is about $520 a month, or less if Agent Substrate scales it to zero overnight.")] },
      { match: /paper|research/i, steps: [TOOL("paper_search", "huggingface-mcp"), T("The most useful one is \"Small encoders still win at fixed-label classification\" (2025): fine-tuned encoders beat 8B instruction models on 9 of 11 intent benchmarks at 1/40th of the cost.")] },
      { match: /licen/i, steps: [T("• Qwen3-8B: Apache 2.0\n• ModernBERT-large: Apache 2.0\n• Phi-4-mini: MIT\nAll three are fine for commercial use. The 120k-ticket dataset is CC BY-NC, so use it for experiments only, not for the production model.")] },
    ],
    fallback: [T("Tell me the task and your constraints (latency, hardware, license), and I'll shortlist models and datasets from Hugging Face.")],
  },
  {
    id: "local-llm-assistant",
    label: "Local Assistant",
    color: "#94a3b8",
    pool: "kagent-default",
    preview: "pod restart report ready.",
    time: "now",
    history: [],
    suggestions: ["which pods restarted today?", "is any data leaving the cluster?", "summarise the kagent namespace"],
    scripts: [
      { match: /restart|pod|crash/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), TOOL("k8s_get_events", "kagent-tool-server"), T("7 pods restarted in the last 24 hours:\n• `shop/checkout-v2-*`: 11 restarts, OOMKilled (fixed by the rollback)\n• `shop/cart-5c8b`: 4, liveness probe timeouts\n• `monitoring/loki-0`: 1, node drain at 03:10\nEverything is stable now.")] },
      { match: /data|leav|privacy|local|ollama/i, steps: [T("No. I run on `qwen3:32b` through Ollama inside the cluster, and my only tool is `kagent-tool-server`. The egress policy on my sandbox only allows the Ollama service and the Kubernetes API.")] },
      { match: /kagent|namespace|summar|health/i, steps: [TOOL("k8s_get_resources", "kagent-tool-server"), T("`kagent` namespace: 14 agents, 13 Ready. `design-to-code` is suspended, which is normal: it's idle and Agent Substrate snapshotted it 2 hours ago. Controller, UI and tool server are all healthy.")] },
    ],
    fallback: [T("I'm a private assistant on a local model, so nothing you ask leaves the cluster. Ask me about pods, events, or the kagent namespace.")],
  },
];

/* Older conversations in each agent's chat list, keyed by agent name. */
export const PAST: Record<string, PastChat[]> = {
  "sre-incident-commander": [
    {
      title: "Health check of the kagent namespace",
      when: "about 2 hours ago",
      history: [
        U("Health check of the kagent namespace"),
        TOOL("k8s_get_resources", "kagent-tool-server"),
        TOOL("k8s_get_events", "kagent-tool-server"),
        T("`kagent` is healthy:\n• controller: 1/1 Ready, no restarts in 9 days\n• ui: 2/2 Ready\n• kagent-tool-server: 1/1 Ready, 126 tools discovered\n• 14 agents, 13 Ready and 1 suspended by Agent Substrate (idle)\nOne warning: `kagent-grafana-mcp` logged 3 timeouts to Grafana at 10:14. They cleared by themselves."),
        E("idle · actor suspended to snapshot · worker freed"),
        U("why did grafana time out?"),
        E("actor resumed from snapshot in 212 ms"),
        TOOL("query_loki_logs", "kagent-grafana-mcp"),
        T("Grafana restarted at 10:13 during a node upgrade, and the MCP server's requests during that minute timed out. It reconnected at 10:15. Nothing to do."),
      ],
    },
  ],
  "pr-reviewer": [
    {
      title: "is the retry logic in #470 safe?",
      when: "3 days ago",
      history: [
        U("is the retry logic in #470 safe?"),
        TOOL("pull_request_read", "github-mcp"),
        T("Not quite. #470 retries `POST /charges` on any 5xx, which can charge a customer twice if the first request succeeded but the response was lost. It needs an `Idempotency-Key` header, which Stripe supports. I left a blocking comment with the fix."),
        U("what would the fix look like?"),
        T("Generate the key once per checkout attempt and send it on every retry:\n\n`const key = crypto.randomUUID();`\n`await retry(() => stripe.charges.create(params, { idempotencyKey: key }));`\n\nStripe returns the original result for a repeated key instead of charging again."),
        U("anywhere else we retry payments?"),
        TOOL("search_code", "github-mcp"),
        T("Two more places, both with the same problem: `subscriptions/renew.ts:88` and `invoices/collect.ts:41`. I opened issue #475 to fix all three together."),
      ],
    },
  ],
  "billing-ops": [
    {
      title: "refund request from Contoso",
      when: "2 days ago",
      history: [
        U("Contoso wants a refund for the seats they removed mid-month"),
        TOOL("list_subscriptions", "stripe-mcp"),
        T("Contoso went from 40 to 25 seats on Oct 16. Under the refund policy, removed seats are credited pro rata, not refunded: 15 seats × 15 days ≈ $562.50."),
        ASK("stripe: apply $562.50 credit to cus_Contoso", [TOOL("create_refund", "stripe-mcp"), T("Applied a $562.50 credit. It comes off their December invoice.")], [T("No credit applied.")], "approved"),
      ],
    },
  ],
  assistant: [
    {
      title: "What can you help me with?",
      when: "5 days ago",
      history: [
        U("What can you help me with?"),
        T("I'm the general-purpose assistant on this cluster. I can answer questions, draft text, and use the built-in Kubernetes tools to look at pods, events and deployments. For anything specialised (incidents, PR reviews, billing), there's a dedicated agent with the right tools and approvals. Ask me which one to use."),
        U("which one handles a failed payment?"),
        T("`billing-ops`. It has Stripe and Sentry tools, and every write to Stripe waits for a human approval, so it can investigate freely without touching money on its own."),
        U("and if checkout is down?"),
        T("`sre-incident-commander`. It reads events, logs and metrics, and drafts the fix (a rollback, a scale-up) for you to approve. It runs on the `secure` harness, so it gets its own gVisor sandbox."),
      ],
    },
  ],
  "assistant-high": [
    {
      title: "Summarize this week's cluster events",
      when: "8 days ago",
      history: [
        U("Summarize this week's cluster events"),
        TOOL("k8s_get_events", "kagent-tool-server"),
        T("2,914 events this week, 41 of them warnings:\n• 23 `FailedScheduling` in `ml`, waiting on GPU nodes on Tuesday\n• 11 `BackOff` in `shop`, the checkout incident\n• 7 `NodeNotReady` during Thursday's node pool upgrade\nNo warnings in the last 36 hours."),
      ],
    },
    {
      title: "Draft a capacity plan for Q1",
      when: "15 days ago",
      history: [
        U("Draft a capacity plan for Q1"),
        TOOL("query_prometheus", "kagent-grafana-mcp"),
        T("CPU requests grew 6% a month over the last two quarters. At that rate the general pool hits 80% in mid-February.\nPlan:\n• Add 4 nodes to `general` in January\n• Move batch jobs to Spot, which frees about 12%\n• Merge the right-sizing PR first, since it frees 9 CPU\nThe `ml` GPU pool is fine; it's mostly idle."),
      ],
    },
  ],
  "local-llm-assistant": [
    {
      title: "Pod restart report",
      when: "32 minutes ago",
      history: [
        U("Pod restart report"),
        TOOL("k8s_get_resources", "kagent-tool-server"),
        T("7 pods restarted in the last 24 hours. 11 of the 16 restarts were `checkout-v2` OOMKills before the rollback. The rest were 4 liveness timeouts on `cart` and 1 node drain for `loki-0`. All stable since 12:47."),
      ],
    },
  ],
};

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

function seedSteps(steps: Step[], out: Msg[]) {
  for (const s of steps) {
    if (s.t === "text") out.push({ id: id(), kind: "agent", text: s.text, done: true });
    if (s.t === "user") out.push({ id: id(), kind: "user", text: s.text });
    if (s.t === "event") out.push({ id: id(), kind: "event", text: s.text });
    if (s.t === "tool") out.push({ id: id(), kind: "tool", name: s.name, server: s.server });
    if (s.t === "approval") {
      out.push({ id: id(), kind: "approval", cmd: s.cmd, status: s.status ?? "pending", approve: s.approve, reject: s.reject });
      // an approval decided in the past also shows what happened next
      if (s.status) seedSteps(s.status === "approved" ? s.approve : s.reject, out);
    }
  }
}

function seed(a: DemoAgent): Msg[] {
  const out: Msg[] = [];
  if (a.historyUser) out.push({ id: id(), kind: "user", text: a.historyUser });
  seedSteps(a.history, out);
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
        } else if (s.t === "user" || s.t === "event") {
          await wait(300);
          push(ai, s.t === "user" ? { id: id(), kind: "user", text: s.text } : { id: id(), kind: "event", text: s.text });
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

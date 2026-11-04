// Example agents, matching the ones seeded on the demo cluster.
export const AGENTS = [
  { name: "sre-incident-commander", label: "Incident Commander", color: "#34d399", model: "default-model-config", harness: "secure", tools: ["kagent-tool-server", "kagent-grafana-mcp"],
    body: "Triages alerts, correlates metrics and events, and drafts the mitigation. Nothing changes in production until a human approves it." },
  { name: "pr-reviewer", label: "PR Reviewer", color: "#f59e0b", model: "claude-sonnet", harness: "medium", tools: ["github-mcp", "context7-mcp"],
    body: "Reviews pull requests against your team rubric and checks API usage against up-to-date library docs." },
  { name: "jira-triage", label: "Jira Triage", color: "#60a5fa", model: "openai-gpt", harness: "low", tools: ["atlassian-mcp", "github-mcp"],
    body: "Sorts new Jira issues, links duplicates, finds the owning repo and suggests a priority." },
  { name: "design-to-code", label: "Design to Code", color: "#f472b6", model: "claude-opus", harness: "claude-code", tools: ["figma-mcp", "github-mcp"],
    body: "Turns Figma frames into React components that match your design system, then opens the pull request." },
  { name: "cve-watch", label: "CVE Watch", color: "#f87171", model: "xai-grok", harness: "low", tools: ["github-mcp", "deepwiki-mcp"],
    body: "Checks new advisories against your dependencies every night and opens an issue for anything you're exposed to." },
  { name: "k8s-cost-optimizer", label: "Cost Optimizer", color: "#a3e635", model: "mistral-large", harness: "medium", tools: ["kagent-tool-server", "kagent-grafana-mcp"],
    body: "Finds idle and over-provisioned workloads and proposes right-sizing changes as pull requests, never as live edits." },
  { name: "docs-librarian", label: "Docs Librarian", color: "#22d3ee", model: "gemini-pro", harness: "long-context", tools: ["notion-mcp", "deepwiki-mcp", "context7-mcp"],
    body: "Answers engineering questions from Notion, repo wikis and live library docs, with a citation for every claim." },
  { name: "billing-ops", label: "Billing Ops", color: "#c084fc", model: "claude-sonnet", harness: "secure", tools: ["stripe-mcp", "sentry-mcp"],
    body: "Investigates failed payments and refund requests. Every write to Stripe waits for a human approval." },
];

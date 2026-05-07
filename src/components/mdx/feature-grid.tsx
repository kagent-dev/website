"use client";

import React from "react";

const iconPaths: Record<string, React.ReactNode> = {
  workflow: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4M17 13V9a2 2 0 0 0-2-2h-4"/></>,
  plug: <><path d="M12 22v-5"/><path d="M9 8V2M15 8V2"/><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8z"/></>,
  layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></>,
  brain: <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></>,
  handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14h2"/><path d="m3 4 2.71 2.71a5.8 5.8 0 0 0 4.79 1.67L12 8.2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  git: <><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1 .4-1 1v2"/><path d="M12 12v3"/></>,
  cog: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  activity: <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>,
  eye: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  cube: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></>,
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: Feature) {
  return (
    <div className="rd-cap-item">
      <div className="rd-cap-check">
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {iconPaths[icon] || iconPaths.cube}
        </svg>
      </div>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}

const ALL_FEATURES: Feature[] = [
  { icon: "workflow", title: "Agent lifecycle via CRDs", description: "Define, version, and roll out agents with kubectl and GitOps — the same workflow as every other workload." },
  { icon: "layers", title: "Multi-runtime support", description: "Go and Python ADK runtimes. Pick the language that fits, or mix both in the same cluster." },
  { icon: "plug", title: "BYO frameworks", description: "LangGraph, CrewAI, Google ADK, or your own — bring any agent framework and kagent orchestrates it." },
  { icon: "brain", title: "Long-term memory", description: "Persistent vector-backed memory across sessions. Agents remember context, not just the last prompt." },
  { icon: "handshake", title: "Human-in-the-loop", description: "Tool approval gates, agent-initiated questions, and cascading HITL — humans stay in control." },
  { icon: "users", title: "Agent-to-Agent (A2A)", description: "Agents discover and invoke each other. Compose multi-agent workflows with first-class delegation." },
  { icon: "git", title: "Skills from Git", description: "Load markdown knowledge from Git repos at startup. Agents learn your runbooks, ADRs, and internal docs." },
  { icon: "cog", title: "Prompt templates", description: "Reusable prompt fragments stored as ConfigMaps. DRY your system prompts across agents." },
  { icon: "activity", title: "Context compaction", description: "Auto-summarization of long conversation histories. Agents stay coherent without blowing token budgets." },
  { icon: "lock", title: "Sandbox & security", description: "Agent sandboxing, RBAC, and security hardening out of the box. Run untrusted code safely." },
  { icon: "eye", title: "Full observability", description: "OTel tracing, Prometheus metrics, structured logs. See every prompt, every tool call, every token." },
  { icon: "cube", title: "Postgres storage", description: "Production-grade Postgres-backed storage with reviewable migrations. No proprietary database lock-in." },
];

export default function FeatureGrid() {
  return (
    <div className="rd-cap-grid" style={{ marginTop: 24 }}>
      {ALL_FEATURES.map((f, i) => (
        <FeatureCard key={i} {...f} />
      ))}
    </div>
  );
}

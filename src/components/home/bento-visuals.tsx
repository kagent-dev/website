"use client";

/* Animated illustrations for the four feature cards. Purely decorative. */

import { useEffect, useState, useSyncExternalStore } from "react";
import { siFigma, siGithub, siGrafana, siHuggingface, siJira, siLinear, siNotion, siSentry, siStripe } from "simple-icons";

const ACCENT = "#a78bfa";
const GREEN = "#34d399";
const RED = "#f87171";

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

/* 1. Sandbox + egress gateway ------------------------------------------- */

export function SandboxVisual() {
  const dests = [
    { y: 34, host: "api.anthropic.com", ok: true },
    { y: 86, host: "mcp.atlassian.com", ok: true },
    { y: 138, host: "169.254.169.254", ok: false },
    { y: 190, host: "pastebin.com", ok: false },
  ];
  return (
    <svg viewBox="0 0 460 224" className="h-auto w-full" role="img" aria-label="Three gVisor sandboxes, one per conversation. Their traffic passes an egress gateway: two destinations are allowed, two are blocked.">
      {/* sandboxes: one per conversation */}
      <rect x="6" y="44" width="122" height="136" rx="16" fill="#0a0a0a" stroke={ACCENT} strokeOpacity="0.6" strokeDasharray="5 5" />
      <text x="67" y="62" textAnchor="middle" fontSize="10" fill="#8f8f8f" fontFamily="var(--font-mono)">gVisor sandboxes</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="16" y={72 + i * 34} width="102" height="26" rx="7" fill="#161616" stroke="rgba(255,255,255,0.12)" />
          <circle cx="29" cy={85 + i * 34} r="3.5" fill={GREEN}>
            <animate attributeName="opacity" values="1;0.35;1" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <text x="39" y={89 + i * 34} fontSize="10" fill="#d4d4d4" fontFamily="var(--font-mono)">sandbox-{i + 1}</text>
        </g>
      ))}

      {/* gateway */}
      <rect x="196" y="20" width="44" height="184" rx="12" fill="#1c1c1c" stroke="rgba(255,255,255,0.1)" />
      <text x="218" y="114" textAnchor="middle" fontSize="10" fill="#8f8f8f" fontFamily="var(--font-mono)" transform="rotate(-90 218 114)">egress gateway</text>

      {dests.map((d, i) => {
        const path = `M128 112 C 162 112, 162 ${d.y}, 196 ${d.y}`;
        const out = `M240 ${d.y} L 300 ${d.y}`;
        const delay = `${i * 0.55}s`;
        return (
          <g key={d.host}>
            <path d={path} fill="none" stroke="rgba(255,255,255,0.08)" />
            <path d={out} fill="none" stroke={d.ok ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)"} />
            <circle r="4" fill={d.ok ? GREEN : RED}>
              <animateMotion dur="2.2s" begin={delay} repeatCount="indefinite" path={path} keyPoints="0;1;1" keyTimes="0;0.55;1" calcMode="linear" />
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.6;1" dur="2.2s" begin={delay} repeatCount="indefinite" />
            </circle>
            {d.ok ? (
              <circle r="4" fill={GREEN}>
                <animateMotion dur="2.2s" begin={delay} repeatCount="indefinite" path={out} keyPoints="0;0;1" keyTimes="0;0.55;0.85" calcMode="linear" />
                <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.55;0.6;0.9" dur="2.2s" begin={delay} repeatCount="indefinite" />
              </circle>
            ) : (
              <text x="190" y={d.y + 4} textAnchor="end" fontSize="13" fontWeight="700" fill={RED} opacity="0">
                ✕
                <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.5;0.6;0.95" dur="2.2s" begin={delay} repeatCount="indefinite" />
              </text>
            )}
            <rect x="304" y={d.y - 14} width="150" height="28" rx="8" fill="#0a0a0a" />
            <circle cx="318" cy={d.y} r="3.5" fill={d.ok ? GREEN : RED} />
            <text x="328" y={d.y + 4} fontSize="11" fill={d.ok ? "#e5e5e5" : "#6b6b6b"} fontFamily="var(--font-mono)" textDecoration={d.ok ? "" : "line-through"}>
              {d.host}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* 3. MCP tool servers wired into kagent -------------------------------- */

type Glyph = { name: string; hex: string; paths: { d: string; fill: string }[] };

const mono = (icon: { title: string; hex: string; path: string }, light = false): Glyph => ({
  name: icon.title,
  hex: `#${icon.hex}`,
  paths: [{ d: icon.path, fill: light ? "#ffffff" : `#${icon.hex}` }],
});

const SLACK: Glyph = {
  name: "Slack",
  hex: "#E01E5A",
  paths: [
    { d: "M5.04 15.16a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h2.1v2.1zm1.07 0a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.26a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-5.26z", fill: "#E01E5A" },
    { d: "M8.21 5.04a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v2.1H8.21zm0 1.07a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1H2.94a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27z", fill: "#36C5F0" },
    { d: "M18.96 8.21a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-2.1V8.21zm-1.07 0a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1V2.94a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.27z", fill: "#2EB67D" },
    { d: "M15.79 18.96a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-2.1h2.1zm0-1.07a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-5.27z", fill: "#ECB22E" },
  ],
};

const GLYPHS: Glyph[] = [
  mono(siGithub, true),
  mono(siJira),
  mono(siFigma),
  SLACK,
  mono(siNotion, true),
  mono(siLinear),
  mono(siSentry, true),
  mono(siStripe),
  mono(siGrafana),
  mono(siHuggingface),
];

export function ToolsVisual() {
  const cx = 230;
  const cy = 112;
  const rx = 178;
  const ry = 84;
  const tile = 40;
  return (
    <svg viewBox="0 0 460 236" className="h-auto w-full" role="img" aria-label={`MCP tool servers connected to kagent: ${GLYPHS.map((g) => g.name).join(", ")}`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
      {GLYPHS.map((g, i) => {
        const a = (i / GLYPHS.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        const spoke = `M${x} ${y} L${cx} ${cy}`;
        return (
          <g key={g.name}>
            <path d={spoke} stroke="rgba(255,255,255,0.07)" />
            <circle r="2.5" fill={g.hex === "#000000" || g.hex === "#181717" || g.hex === "#362D59" ? "#ffffff" : g.hex}>
              <animateMotion dur="2.6s" begin={`${(i * 0.26).toFixed(2)}s`} repeatCount="indefinite" path={spoke} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="2.6s" begin={`${(i * 0.26).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
            <g>
              <title>{g.name}</title>
              <rect x={x - tile / 2} y={y - tile / 2} width={tile} height={tile} rx="12" fill="#0a0a0a" stroke="rgba(255,255,255,0.1)" />
              <svg x={x - 10} y={y - 10} width="20" height="20" viewBox="0 0 24 24">
                {g.paths.map((p, k) => (
                  <path key={k} d={p.d} fill={p.fill} />
                ))}
              </svg>
            </g>
          </g>
        );
      })}
      {/* hub */}
      <circle cx={cx} cy={cy} r="40" fill="rgba(167,139,250,0.08)">
        <animate attributeName="r" values="36;46;36" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="18" fill="#1c1c1c" stroke="rgba(167,139,250,0.45)" />
      <image href="/images/kagent-logo-mark.png" x={cx - 18} y={cy - 18} width="36" height="36" />
      <text x={cx} y="232" textAnchor="middle" fontSize="10" fill="#8f8f8f" fontFamily="var(--font-mono)">RemoteMCPServers · tools discovered automatically</text>
    </svg>
  );
}

/* 4. Orchestrator handing work to subagents ----------------------------- */

const SUBS = [
  { x: 60, label: "CO", name: "Cost Optimizer", color: "#a3e635" },
  { x: 230, label: "IC", name: "Incident Commander", color: "#34d399" },
  { x: 400, label: "DL", name: "Docs Librarian", color: "#22d3ee" },
];

export function TeamVisual() {
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setK((x) => (x + 1) % 4), 1400);
    return () => clearInterval(t);
  }, [reduce]);
  const status = ["Asking Cost Optimizer…", "Looping in Incident Commander…", "Sending to Docs Librarian…", "Stitching 3 answers together ✓"][k];
  return (
    <div>
      <svg viewBox="0 0 460 196" className="h-auto w-full" role="img" aria-label="A platform orchestrator agent delegating to three subagents.">
        {SUBS.map((s, i) => {
          const path = `M230 52 C 230 100, ${s.x} 90, ${s.x} 138`;
          const active = k === i || k === 3;
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={active ? s.color : "rgba(255,255,255,0.1)"} strokeOpacity={active ? 0.6 : 1} strokeWidth="1.5" style={{ transition: "stroke 300ms" }} />
              {k === i && (
                <circle r="5" fill={s.color}>
                  <animateMotion dur="1.4s" repeatCount="indefinite" path={path} />
                </circle>
              )}
              {k === 3 && (
                <circle r="5" fill={s.color}>
                  <animateMotion dur="1.4s" repeatCount="indefinite" path={path} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
                </circle>
              )}
              <circle cx={s.x} cy="152" r="14" fill={s.color} opacity={active ? 1 : 0.35} style={{ transition: "opacity 300ms" }} />
              <text x={s.x} y="186" textAnchor="middle" fontSize="11.5" fill={active ? "#ffffff" : "#8f8f8f"} style={{ transition: "fill 300ms" }}>{s.name}</text>
            </g>
          );
        })}
        <rect x="122" y="14" width="216" height="40" rx="20" fill="#1c1c1c" stroke="rgba(167,139,250,0.5)" />
        <circle cx="146" cy="34" r="6" fill={ACCENT} />
        <text x="160" y="38" fontSize="12" fill="#fff">platform-orchestrator</text>
      </svg>
      <div className="mt-2 flex items-center gap-2 font-geistmono text-[11px] text-white/70">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ks-accent" />
        {status}
      </div>
    </div>
  );
}

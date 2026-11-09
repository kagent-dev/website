/* Small illustrations for the three "How it works" cards. Decorative only. */

import { siClaude, siFigma, siGithub, siJira } from "simple-icons";

const Brand = ({ icon, color }: { icon: { path: string; title: string }; color?: string }) => (
  <span title={icon.title} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#141414]">
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d={icon.path} fill={color ?? "#ffffff"} />
    </svg>
  </span>
);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex h-[184px] flex-col justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:14px_14px]">
    {children}
  </div>
);

/* What: model + prompt + tools */
export function TemplateVisual() {
  return (
    <Frame>
      <div className="mx-auto w-full max-w-[260px] rounded-xl border border-violet-400/25 bg-[#141414] p-3 shadow-[0_12px_32px_-16px_rgba(139,92,246,0.7)]">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D97757]/15">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path d={siClaude.path} fill="#D97757" />
            </svg>
          </span>
          <span className="text-[13px] text-white">claude-sonnet</span>
          <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-px font-geistmono text-[10px] text-white/50">model</span>
        </div>
        <div className="mt-2.5 space-y-1.5 rounded-lg bg-black/40 p-2">
          <div className="h-1.5 w-11/12 rounded-full bg-white/15" />
          <div className="h-1.5 w-8/12 rounded-full bg-white/10" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Brand icon={siGithub} />
          <Brand icon={siJira} color="#2684FF" />
          <Brand icon={siFigma} color="#F24E1E" />
          <span className="ml-auto font-geistmono text-[10px] text-white/45">MCP tools</span>
        </div>
      </div>
    </Frame>
  );
}

/* Where: warm worker pool, sandbox, snapshots */
export function HarnessVisual() {
  const busy = [1, 4, 6];
  return (
    <Frame>
      <div className="mx-auto w-full max-w-[270px]">
        <div className="mb-1.5 flex justify-between font-geistmono text-[10px] text-white/45">
          <span>WorkerPool · kagent-high</span>
          <span className="text-emerald-400">● warm</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((w) => (
            <div key={w} className="rounded-lg border border-white/10 bg-[#141414] p-1.5">
              <div className="mb-1 font-geistmono text-[9px] text-white/40">pod-{w}</div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 3 }, (_, k) => (
                  <span
                    key={k}
                    className={`h-3 rounded-[3px] ${busy.includes(w * 3 + k) ? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]" : "bg-white/[0.07]"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 font-geistmono text-[10px]">
          <span className="flex flex-1 items-center gap-1.5 rounded-md border border-white/10 bg-[#141414] px-2 py-1.5 text-white/70">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" aria-hidden><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" /></svg>
            gVisor sandbox
          </span>
          <span className="flex flex-1 items-center gap-1.5 rounded-md border border-white/10 bg-[#141414] px-2 py-1.5 text-white/70">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" aria-hidden><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
            snapshots
          </span>
        </div>
      </div>
    </Frame>
  );
}

/* Pair: template + harness -> agent -> sessions */
export function AgentVisual() {
  return (
    <Frame>
      <svg viewBox="0 0 280 150" className="mx-auto h-auto w-full max-w-[290px]" aria-hidden>
        <defs>
          <linearGradient id="pairline" x1="0" x2="1">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* inputs */}
        <rect x="4" y="14" width="92" height="30" rx="8" fill="#141414" stroke="rgba(255,255,255,0.12)" />
        <text x="50" y="33" textAnchor="middle" fontSize="11" fill="#e5e5e5" fontFamily="var(--font-geist-mono)">template</text>
        <rect x="4" y="106" width="92" height="30" rx="8" fill="#141414" stroke="rgba(255,255,255,0.12)" />
        <text x="50" y="125" textAnchor="middle" fontSize="11" fill="#e5e5e5" fontFamily="var(--font-geist-mono)">harness</text>
        <path d="M96 29 C 120 29, 116 75, 134 75" fill="none" stroke="url(#pairline)" strokeWidth="1.6" />
        <path d="M96 121 C 120 121, 116 75, 134 75" fill="none" stroke="url(#pairline)" strokeWidth="1.6" />
        {/* agent */}
        <circle cx="160" cy="75" r="30" fill="rgba(139,92,246,0.15)" />
        <rect x="134" y="55" width="52" height="40" rx="12" fill="#1c1c1c" stroke="rgba(167,139,250,0.6)" />
        <image href="/images/kagent-logo-mark.png" x="146" y="61" width="28" height="28" />
        {/* sessions */}
        {[28, 75, 122].map((y, i) => (
          <g key={y}>
            <path d={`M186 75 C 206 75, 210 ${y}, 228 ${y}`} fill="none" stroke="rgba(167,139,250,0.45)" strokeWidth="1.4" />
            <rect x="228" y={y - 11} width="48" height="22" rx="6" fill="#141414" stroke="rgba(255,255,255,0.12)" />
            <circle cx="240" cy={y} r="3" fill={i === 1 ? "#4b4b55" : "#34d399"} />
            <text x="249" y={y + 3.5} fontSize="9" fill="#a3a3a3" fontFamily="var(--font-geist-mono)">{i === 1 ? "idle" : "chat"}</text>
          </g>
        ))}
      </svg>
      <div className="mt-1 text-center font-geistmono text-[10px] text-white/45">one Agent · many sandboxed sessions</div>
    </Frame>
  );
}

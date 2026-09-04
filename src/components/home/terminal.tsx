"use client";

import type { TermLine } from "@/data/home-content";
import { useTick } from "./use-tick";

/** Text colour for a terminal line: green for success, dimmed for output, bright for commands. */
export function termLineClass(l: TermLine) {
  return l.ok ? "text-[#7FD1A8]" : l.out ? "text-kg-term-dim" : "text-kg-term-tx";
}

/** Reveal lines one at a time, then hold on the finished output. */
export function rollLines<T>(lines: T[], tick: number) {
  return lines.slice(0, Math.min(lines.length, 1 + tick));
}

/** macOS-style traffic lights with a centred mono caption. */
export function WindowChrome({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" />
      <span className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" />
      <span className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
      <span className="mx-auto font-mono text-[11.5px] tracking-[0.05em] text-kg-tx4">{title}</span>
    </div>
  );
}

/**
 * A self-animating terminal that types out `lines` and loops. Always dark,
 * whatever the page theme, so the command colours stay legible.
 */
export function TerminalRoll({ title, lines, className = "" }: { title: string; lines: TermLine[]; className?: string }) {
  const tick = useTick(340);
  const shown = rollLines(lines, tick);
  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-kg-term ${className}`}>
      <WindowChrome title={title} className="border-b border-white/[0.07] px-4 py-[11px] [&>span:last-child]:text-kg-term-dim" />
      <div className="px-5 py-[18px] font-mono text-[13px] leading-[1.8]">
        {shown.map((l, i) => (
          <div key={i} className={`animate-kg-rise whitespace-pre-wrap ${termLineClass(l)}`}>
            <span className="text-kg-acc">{l.p ?? ""}</span>
            {l.text}
          </div>
        ))}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-kg-acc">$</span>
          <span className="h-[15px] w-2 animate-kg-caret bg-kg-term-tx" />
        </div>
      </div>
    </div>
  );
}

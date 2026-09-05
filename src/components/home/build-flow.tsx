"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_STEPS } from "@/data/home-content";
import { ArrowLink, ArrowList } from "./primitives";

/** YAML/Markdown line colouring: comments muted, apiVersion/kind in accent, the rest neutral. */
function codeLineClass(text: string) {
  const t = text.trim();
  if (t.startsWith("#")) return "text-kg-ycom";
  if (/^(apiVersion|kind):/.test(t)) return "text-kg-ykey";
  return "text-kg-yval";
}

/**
 * The scroll-driven "build" walkthrough. Steps stack on the left; the step
 * nearest the viewport centre is active and drives the sticky panel on the
 * right: the step's manifest in an editor pane with a status line showing the
 * command that ships it.
 */
export function BuildFlow() {
  const [active, setActive] = useState(0);
  const [applied, setApplied] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Active step = the block whose centre is nearest the viewport centre.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestD = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive((a) => (a === best ? a : best));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    pick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // The status line "applies" the manifest shortly after a step becomes active.
  useEffect(() => {
    setApplied(false);
    const id = setTimeout(() => setApplied(true), 900);
    return () => clearTimeout(id);
  }, [active]);

  const step = BUILD_STEPS[Math.min(active, BUILD_STEPS.length - 1)];

  return (
    <div className="grid w-full max-w-[1160px] grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(420px,1.15fr)] lg:gap-14">
      {/* Steps */}
      <div className="flex flex-col">
        {BUILD_STEPS.map((s, i) => (
          <div
            key={s.kicker}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={`flex flex-col justify-center py-7 transition-opacity duration-400 ease-standard lg:min-h-screen lg:py-0 ${
              i === active ? "opacity-100" : "lg:opacity-35"
            }`}
          >
            <span className="font-display text-[clamp(26px,2.4vw,34px)] font-medium uppercase tracking-[-0.02em] text-kg-tx1">
              {s.kicker}
            </span>
            <h2 className="mt-3.5 font-display text-[clamp(24px,2.4vw,32px)] font-medium leading-[1.18] tracking-[-0.022em] text-kg-tx2">
              {s.title}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.65] text-kg-tx2">{s.body}</p>
            <ArrowList items={s.points} className="mt-[26px] gap-[11px]" />
            <ArrowLink href={s.href} className="mt-7">
              {s.linkText}
            </ArrowLink>
          </div>
        ))}
      </div>

      {/* Sticky panel (shown first on small screens) */}
      <div className="-order-1 min-w-0 lg:order-none lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center">
        <div className="overflow-hidden rounded-[10px] border border-kg-term-bd bg-kg-term shadow-[var(--kg-term-shadow)]">
          {/* Editor: title bar with the file name */}
          <div className="flex items-center gap-2 border-b border-kg-term-bd px-4 py-[11px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
            <span key={active} className="mx-auto animate-kg-rise font-mono text-[11.5px] tracking-[0.05em] text-kg-term-dim">
              {step.file}
            </span>
          </div>
          <pre
            key={`code-${active}`}
            className="m-0 h-[min(460px,calc(100vh-260px))] min-h-[260px] overflow-auto px-[26px] py-5 font-mono text-[12.5px] leading-[1.75] text-kg-term-tx [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {step.code.map((text, i) => (
              <div
                key={`${active}-${i}`}
                className={`w-max min-w-full animate-kg-rise whitespace-pre ${codeLineClass(text)}`}
                style={{ animationDuration: "300ms", animationDelay: `${Math.min(i * 22, 500)}ms` }}
              >
                {text || " "}
              </div>
            ))}
          </pre>

          {/* Status line: the command that ships this manifest, and its result */}
          <div
            key={`status-${active}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-kg-term-bd bg-kg-term-bar px-[26px] py-3 font-mono text-[12px] leading-[1.6]"
          >
            <span className="animate-kg-rise text-kg-term-tx">
              <span className="text-kg-acc">$ </span>
              {step.apply.cmd}
            </span>
            <span
              className={`ml-auto flex items-center gap-2 text-kg-ystr transition-opacity duration-400 ${applied ? "opacity-100" : "opacity-0"}`}
            >
              <span aria-hidden>✓</span>
              {step.apply.result}
            </span>
          </div>
        </div>
        <div className="mt-3.5 flex gap-1.5" aria-hidden>
          {BUILD_STEPS.map((s, i) => (
            <span
              key={s.kicker}
              className={`h-0.5 flex-1 transition-colors duration-300 ${i === active ? "bg-kg-acc" : "bg-kg-bd-soft"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

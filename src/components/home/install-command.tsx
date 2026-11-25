"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";

/* The one-line install shown in the hero: the CLI installer, then `kagent install`,
   which sets up kagent and Agent Substrate in the current cluster. */

export const INSTALL_COMMAND = "curl -sL https://kagent.dev/install | bash && kagent install";

export default function InstallCommand({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex items-center gap-3 font-geistmono text-xs uppercase tracking-[0.2em] text-violet-300">
        <span aria-hidden className="h-px w-10 bg-gradient-to-r from-transparent to-violet-400/60" />
        Install Agent Substrate with kagent
        <span aria-hidden className="h-px w-10 bg-gradient-to-l from-transparent to-violet-400/60" />
      </div>

      {/* gradient hairline border around one pill: command, copy, install */}
      <div className="w-full rounded-full bg-gradient-to-r from-violet-500/70 via-white/15 to-violet-500/70 p-px shadow-[0_0_70px_-18px_rgba(139,92,246,0.85)]">
        <div className="flex items-center gap-2 rounded-full bg-[#0b0b11] py-1.5 pl-6 pr-1.5">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left font-geistmono text-sm text-white/90 [scrollbar-width:none]">
            <span aria-hidden className="mr-3 select-none text-violet-400">$</span>
            {INSTALL_COMMAND}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Install command copied" : "Copy the install command"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={href}
            className="group flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Install
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

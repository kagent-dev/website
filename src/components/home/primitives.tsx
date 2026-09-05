import Link from "next/link";
import type { ReactNode } from "react";

/** Full-width band with the 1160px content column used throughout the redesign. */
export function Section({
  id,
  className = "",
  innerClassName = "",
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`flex justify-center px-8 scroll-mt-16 ${className}`}>
      <div className={`w-full max-w-[1160px] ${innerClassName}`}>{children}</div>
    </section>
  );
}

const btnBase =
  "inline-flex items-center gap-2.5 rounded-lg px-6 py-[13px] font-display text-[15px] font-medium transition-colors active:scale-[0.98]";

export const primaryBtn = `${btnBase} bg-kg-brand text-white hover:bg-[#9640F0]`;
export const ghostBtn = `${btnBase} border border-kg-bd bg-kg-sf text-kg-tx1 hover:bg-kg-bd-soft`;

/** Accent-coloured inline link with a trailing arrow. */
export function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const external = href.startsWith("http");
  const cls = `inline-flex items-center gap-2 font-display text-[15px] text-kg-acc transition-opacity hover:opacity-80 ${className}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children} <span aria-hidden>→</span>
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}

/** Small mono label above a heading. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`font-mono text-xs tracking-[0.06em] text-kg-tx3 ${className}`}>{children}</div>;
}

/** Bulleted list with accent arrows, as used in the feature rows and build steps. */
export function ArrowList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-3 ${className}`}>
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3 text-[15.5px] text-kg-tx2">
          <span className="text-kg-acc" aria-hidden>
            →
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

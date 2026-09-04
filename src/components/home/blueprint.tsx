import type { ComponentType, ReactNode } from "react";

/*
 * "Blueprint" primitives: a dot-grid ground, frames with corner handles,
 * dashed chips and hairline grids with node dots at every intersection.
 * All theme-aware through the kg-* tokens.
 */

/** Dot-grid background, for section bands and schematic panels. */
export const dotGrid = "bg-[radial-gradient(var(--kg-dot)_1px,transparent_1px)] [background-size:22px_22px]";

/** Four small squares pinned to the corners of a `relative` parent. */
export function Handles({ className = "" }: { className?: string }) {
  const h = `pointer-events-none absolute z-10 h-[7px] w-[7px] border border-kg-tx3 bg-kg-pg ${className}`;
  return (
    <>
      <span className={`${h} -left-1 -top-1`} aria-hidden />
      <span className={`${h} -right-1 -top-1`} aria-hidden />
      <span className={`${h} -bottom-1 -left-1`} aria-hidden />
      <span className={`${h} -bottom-1 -right-1`} aria-hidden />
    </>
  );
}

/** A bordered frame with corner handles and an optional mono label sitting on the top edge. */
export function Frame({ label, className = "", children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`relative border border-kg-bd ${className}`}>
      <Handles />
      {label && (
        <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-kg-pg px-2 font-mono text-[11.5px] tracking-[0.08em] text-kg-acc">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/** Dashed accent tile with an icon: "a unit of user code". */
export function Chip({ icon: Icon, className = "" }: { icon: ComponentType<{ className?: string }>; className?: string }) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-dashed border-kg-acc bg-[rgba(139,47,232,0.12)] text-kg-acc ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** Dashed mono label box, used for the inputs and outputs of a schematic. */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border border-dashed border-kg-bd bg-kg-pg px-2.5 py-1 font-mono text-[11px] tracking-[0.05em] text-kg-tx3 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Cells separated by hairlines with a node dot at every intersection.
 * `cols` is the Tailwind grid-cols class list for the breakpoints wanted.
 */
export function HairlineGrid({ cols, className = "", children }: { cols: string; className?: string; children: ReactNode }) {
  return <div className={`grid border-l border-t border-kg-bd ${cols} ${className}`}>{children}</div>;
}

export function HairlineCell({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`relative border-b border-r border-kg-bd bg-kg-pg ${className}`}>
      <Handles />
      {children}
    </div>
  );
}

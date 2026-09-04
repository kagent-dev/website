"use client";

import { useEffect, useState } from "react";

/**
 * A slow clock that drives the animated panels. Increments every
 * `intervalMs`; when the visitor prefers reduced motion it stays frozen on a
 * non-zero value so the panels still render a plausible mid-state.
 */
export function useTick(intervalMs = 660) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTick(7);
      return;
    }
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

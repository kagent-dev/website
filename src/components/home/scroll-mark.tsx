"use client";

/*
 * A big, faint kagent mark sits behind the hero title, moves to the right
 * side as the page scrolls, and settles into the faint mark above the
 * footer at the end. Positions come from #hero-title and #footer-mark.
 */

import { useEffect, useRef } from "react";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const FAINT = 0.14; // opacity while floating in the background
const FOOTER = 0.22; // opacity of the footer mark

export default function ScrollMark() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    const footer = document.getElementById("footer-mark");
    const title = document.getElementById("hero-title");
    if (!node || !footer || !title) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    // Targets are computed from scroll position; the rendered mark eases
    // toward them every frame, so wheel steps turn into a smooth glide.
    const cur = { x: 0, y: 0, s: 0, o: 0, g: 0.5, init: false };

    const target = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const f = footer.getBoundingClientRect();
      const tr = title.getBoundingClientRect();

      // start: big, centered behind the title
      const startSize = Math.min(900, vw * 0.85);
      const start = { x: vw / 2, y: tr.top + tr.height / 2, s: startSize };
      // floating spot: a little bigger, on the right, partly past the edge
      const big = Math.min(1300, vw * 1.05);
      const dock = { x: vw - big * 0.2, y: vh * 0.55, s: big };
      const end = { x: f.left + f.width / 2, y: f.top + f.height / 2, s: f.width };

      // phase 1: behind the title -> right side, over the first ~900px
      const t1 = still ? 0 : ease(clamp(window.scrollY / 900));
      // phase 2: background mark -> footer mark, as the footer mark rises
      const t3 = still ? 0 : ease(clamp(1 - (f.top - vh * 0.45) / (vh * 0.6)));

      let x = lerp(start.x, dock.x, t1);
      let y = lerp(start.y, dock.y, t1);
      let s = lerp(start.s, dock.s, t1);
      let o = lerp(0.16, FAINT, t1);
      if (t3 > 0) {
        x = lerp(x, end.x, t3);
        y = lerp(y, end.y, t3);
        s = lerp(s, end.s, t3);
        o = t3 < 0.92 ? lerp(o, FOOTER, t3 / 0.92) : FOOTER * (1 - (t3 - 0.92) / 0.08);
      }
      footer.style.opacity = String(FOOTER * clamp((t3 - 0.92) / 0.08));
      return { x, y, s, o, g: lerp(0.5, 0, t1) };
    };

    const render = () => {
      node.style.transform = `translate3d(${cur.x - cur.s / 2}px, ${cur.y - cur.s / 2}px, 0)`;
      node.style.width = `${cur.s}px`;
      node.style.height = `${cur.s}px`;
      node.style.opacity = String(cur.o);
      node.style.setProperty("--glow", String(cur.g));
    };

    const tick = () => {
      raf = 0;
      const t = target();
      if (!cur.init || still) {
        Object.assign(cur, t, { init: true });
        render();
        return;
      }
      const k = 0.12; // easing per frame
      let moving = false;
      for (const key of ["x", "y", "s", "o", "g"] as const) {
        const d = t[key] - cur[key];
        cur[key] += d * k;
        if (Math.abs(d) > (key === "o" || key === "g" ? 0.001 : 0.3)) moving = true;
      }
      render();
      if (moving) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      footer.style.opacity = "";
    };
  }, []);

  return (
    <div ref={el} aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0 will-change-transform" style={{ width: 0, height: 0 }}>
      <span className="absolute -inset-[20%] rounded-full bg-violet-500/50 blur-3xl" style={{ opacity: "var(--glow, 1)" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/kagent-logo-mark.png" alt="" className="relative h-full w-full" />
    </div>
  );
}

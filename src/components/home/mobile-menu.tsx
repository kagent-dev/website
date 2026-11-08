"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/* The homepage header's nav below md: a toggle and a full-width panel under the header. */
export function MobileMenu({ links }: { links: { href: string; label: string; external?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="home-mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ks-card2 text-white/80 hover:text-white"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <nav
          id="home-mobile-menu"
          className="absolute inset-x-0 top-full z-50 border-y border-ks-line bg-ks-bg/95 px-6 py-4 backdrop-blur"
        >
          <ul className="flex flex-col text-base text-white/80">
            {links.map((l) => (
              <li key={l.href}>
                {l.external ? (
                  <a href={l.href} className="block py-3 hover:text-white" onClick={() => setOpen(false)}>
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} className="block py-3 hover:text-white" onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

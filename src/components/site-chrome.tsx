"use client";

import { usePathname } from "next/navigation";

/* The homepage and the pages that share its look bring their own nav and footer; every other page uses the shared ones. */
const OWN_CHROME = new Set(["/", "/substrate-calculator"]);

/* The blog brings the homepage's header but keeps the shared footer. */
const ownsNav = (path: string) => OWN_CHROME.has(path) || path === "/blog" || path.startsWith("/blog/");

export default function SiteChrome({ children, nav = false }: { children: React.ReactNode; nav?: boolean }) {
  const path = usePathname();
  const own = nav ? ownsNav(path) : OWN_CHROME.has(path);
  return own ? null : <>{children}</>;
}

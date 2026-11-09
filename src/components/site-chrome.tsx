"use client";

import { usePathname } from "next/navigation";

/* The homepage and the pages that share its look bring their own nav and footer; every other page uses the shared ones. */
const OWN_CHROME = new Set(["/", "/substrate-calculator"]);

const ownsChrome = (path: string) => OWN_CHROME.has(path) || path === "/blog" || path.startsWith("/blog/");

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return ownsChrome(usePathname()) ? null : <>{children}</>;
}

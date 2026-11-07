"use client";

import { usePathname } from "next/navigation";

/* The homepage and the pages that share its look bring their own nav and footer; every other page uses the shared ones. */
const OWN_CHROME = new Set(["/", "/substrate-calculator"]);

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return OWN_CHROME.has(usePathname()) ? null : <>{children}</>;
}

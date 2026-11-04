"use client";

import { usePathname } from "next/navigation";

/* The homepage brings its own nav and footer; every other page uses the shared ones. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}

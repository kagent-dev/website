import React from "react";
import { HomeFooter, HomeHeader, geistMono, geistSans } from "@/components/home/chrome";

interface BlogLayoutProps {
  children: React.ReactNode;
}

/* The blog shares the homepage's look: its header and footer, Geist, and its dark palette.
   The theme variables are set to the homepage's colors so the shared components follow along. */
const HOME_PALETTE = {
  "--background": "0 0% 3.9%",
  "--foreground": "0 0% 98%",
  "--card": "0 0% 7.8%",
  "--card-foreground": "0 0% 98%",
  "--popover": "0 0% 7.8%",
  "--popover-foreground": "0 0% 98%",
  "--primary": "255.1 91.7% 76.3%",
  "--primary-foreground": "0 0% 3.9%",
  "--secondary": "0 0% 11%",
  "--secondary-foreground": "0 0% 98%",
  "--muted": "0 0% 11%",
  "--muted-foreground": "0 0% 56.1%",
  "--accent": "0 0% 11%",
  "--accent-foreground": "0 0% 98%",
  "--border": "0 0% 14.9%",
  "--input": "0 0% 14.9%",
  "--ring": "255.1 91.7% 76.3%",
} as React.CSSProperties;

export default function BlogLayout({  children }: BlogLayoutProps) {
  return (
    <div
      style={HOME_PALETTE}
      className={`${geistSans.variable} ${geistMono.variable} dark relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] font-geist text-white antialiased [color-scheme:dark]`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]">
        <div className="absolute left-1/2 top-0 h-[480px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),rgba(139,92,246,0.04)_55%,transparent)]" />
      </div>
      <HomeHeader />
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-256px)]">

          <div className="prose-lg p-4 md:p-8 lg:p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

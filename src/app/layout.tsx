import type React from "react";
import '@docsearch/css';
import "./globals.css";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import SiteChrome from "@/components/site-chrome";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Build, secure, and manage agents at scale on Agent Substrate",
  description: "kagent is an open-source platform for deploying, managing and governing AI agents on Kubernetes. Agents run on Agent Substrate: sandboxed, suspended when idle, and resumed in as little as 150ms.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kagent.dev"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <GoogleTagManager gtmId="GTM-KNRGVQPF" />
      <body className="min-h-screen bg-background flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SiteChrome><Navbar /></SiteChrome>
          <main className="flex-1">{children}</main>
          <SiteChrome><Footer /></SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type React from "react";
import "./globals.css";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import KubeConAnnouncementBar from "@/components/kubecon-announcement-bar";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import '@docsearch/css';

export const metadata: Metadata = {
  title: "kagent | Bringing Agentic AI to cloud native",
  description: "An open-source framework for DevOps and platform engineers to run AI agents in Kubernetes, automating complex operations and troubleshooting tasks.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kagent.dev"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <GoogleTagManager gtmId="GTM-KNRGVQPF" />
      <body className="min-h-screen bg-background flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
      <Script src="https://cdn.jsdelivr.net/npm/@docsearch/react@3" />
    </html>
  );
}

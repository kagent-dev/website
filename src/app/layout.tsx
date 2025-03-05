import type React from "react";
import "./globals.css";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "kagent",
  description: "An open-source framework for DevOps and platform engineers to run AI agents in Kubernetes, automating complex operations and troubleshooting tasks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />

          <main className="flex-1">{children}</main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

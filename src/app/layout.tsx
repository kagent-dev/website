import type React from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import "./globals.css";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "kagent",
  description: "An open-source framework for DevOps and platform engineers to run AI agents in Kubernetes, automating complex operations and troubleshooting tasks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Navigation */}
          <nav className="py-8">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-3">
                  <Bot className="h-6 w-6 text-violet-500" />
                  <span className="text-lg font-medium">kagent</span>
                </Link>
                <div className="flex items-center space-x-8">
                  <Button variant="link" className="text-secondary-foreground" asChild>
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button variant="link" className="text-secondary-foreground" asChild>
                    <Link href="/tools">Tool Registry</Link>
                  </Button>
                  <Button variant="link" className="text-secondary-foreground" asChild>
                    <Link href="https://github.com/kagent-dev/kagent">GitHub</Link>
                  </Button>
                  <Button variant="link" className="text-secondary-foreground" asChild>
                    <Link href="#">Community</Link>
                  </Button>
                  <ThemeToggle />
                  <Button variant="secondary" asChild>
                    <Link href="/docs/quickstart">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1">{children}</main>

          <footer className="mt-auto py-12 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary">Documentation</Link>
                <Link href="https://github.com/kagent-dev/kagent" className="text-sm text-muted-foreground hover:text-primary">GitHub</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Community</Link>
                <Link href="/docs/examples" className="text-sm text-muted-foreground hover:text-primary">Examples</Link>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>kagent is an open source project</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
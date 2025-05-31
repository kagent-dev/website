import Link from "next/link";
import KagentLogo from "./icons/kagent-logo";
import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";
import { Separator } from "./ui/separator";

export default function Footer() {
  return (
    <footer className="mt-auto py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Getting Started Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Getting Started</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/introduction/installation" className="text-sm text-muted-foreground hover:text-primary">
                  Installing kagent
                </Link>
              </li>
              <li>
                <Link href="/docs/getting-started/quickstart" className="text-sm text-muted-foreground hover:text-primary">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link href="/docs/getting-started/first-agent" className="text-sm text-muted-foreground hover:text-primary">
                  First Agent Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/getting-started/first-mcp-tool" className="text-sm text-muted-foreground hover:text-primary">
                  First MCP Tool
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Documentation</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/introduction/what-is-kagent" className="text-sm text-muted-foreground hover:text-primary">
                  What is kagent
                </Link>
              </li>
              <li>
                <Link href="/docs/introduction/architecture" className="text-sm text-muted-foreground hover:text-primary">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/docs/introduction/core-concepts" className="text-sm text-muted-foreground hover:text-primary">
                  Core Concepts
                </Link>
              </li>
              <li>
                <Link href="/docs/introduction/llm-providers" className="text-sm text-muted-foreground hover:text-primary">
                  Configuring LLM Providers
                </Link>
              </li>
            </ul>
          </div>

          {/* Examples Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Examples</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/tools" className="text-sm text-muted-foreground hover:text-primary">
                  Tools
                </Link>
              </li>
              <li>
                <Link href="/agents" className="text-sm text-muted-foreground hover:text-primary">
                  Agents
                </Link>
              </li>
              <li>
                <Link href="/docs/examples/a2a-agents" className="text-sm text-muted-foreground hover:text-primary">
                  A2A Agents
                </Link>
              </li>
              <li>
                <Link href="/docs/examples/documentation-agent" className="text-sm text-muted-foreground hover:text-primary">
                  Documentation Agent
                </Link>
              </li>
              <li>
                <Link href="/docs/examples/slack-a2a" className="text-sm text-muted-foreground hover:text-primary">
                  Slack and A2A
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Community</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href={DISCORD_LINK} className="text-sm text-muted-foreground hover:text-primary">
                  Discord
                </Link>
              </li>
              <li>
                <Link href={GITHUB_LINK} className="text-sm text-muted-foreground hover:text-primary">
                  GitHub
                </Link>
              </li>
              <li>
                <Link href="https://github.com/kagent-dev/kagent/blob/main/CONTRIBUTION.md" className="text-sm text-muted-foreground hover:text-primary">
                  Contributing
                </Link>
              </li>
              <li>
                <Link href="/docs/resources/faq" className="text-sm text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap" className="text-sm text-muted-foreground hover:text-primary">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <KagentLogo animate={true} className="h-6 w-6 text-[#942DE7]" />
            <p>is an open source project</p>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} kagent. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

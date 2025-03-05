import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";
import Link from "next/link";
import KAgentLogoWithText from "./icons/kagent-logo-text";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export default function Navbar() {
  return (
    <nav className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <KAgentLogoWithText className="h-5" />
          </Link>
          <div className="flex items-center space-x-8">
            <Button variant="link" className="text-secondary-foreground" asChild>
              <Link href="/docs">Docs</Link>
            </Button>
            <Button variant="link" className="text-secondary-foreground" asChild>
              <Link href="/tools">Tools</Link>
            </Button>
            <Button variant="link" className="text-secondary-foreground" asChild>
              <Link href="/agents">Agents</Link>
            </Button>
            <Button variant="link" className="text-secondary-foreground" asChild>
              <Link href={GITHUB_LINK}>GitHub</Link>
            </Button>
            <Button variant="link" className="text-secondary-foreground" asChild>
              <Link href={DISCORD_LINK}>Community</Link>
            </Button>
            <ThemeToggle />
            <Button variant="secondary" asChild>
              <Link href="/docs/quickstart">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

import Link from "next/link";
import KagentLogo from "./icons/kagent-logo";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";

export default function Footer() {
  return (
    <footer className="mt-auto py-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary">
            Documentation
          </Link>
          <Link href={GITHUB_LINK} className="text-sm text-muted-foreground hover:text-primary">
            GitHub
          </Link>
          <Link href={DISCORD_LINK} className="text-sm text-muted-foreground hover:text-primary">
            Community
          </Link>
          <Link href="/docs/getting-started/quickstart" className="text-sm text-muted-foreground hover:text-primary">
            Get Started
          </Link>
        </div>
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <KagentLogo animate={true} className="h-6 w-6 text-[#942DE7]" />
          <p>is an open source project</p>
        </div>
      </div>
    </footer>
  );
}

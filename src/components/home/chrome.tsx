import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

/* The homepage's own header, footer and fonts, shared with the pages that use its look. */

export const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const DOCS = "/docs/kagent/1.x";
export const START = `${DOCS}/get-started/your-first-agent`;
export const GITHUB = "https://github.com/kagent-dev/kagent";
export const SUBSTRATE = "https://ate.dev/";

export function HomeHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
        <Image src="/images/kagent-logo-mark.png" alt="" width={36} height={36} />
        kagent
      </Link>
      <nav className="hidden gap-8 text-sm text-white/80 md:flex">
        <Link href={DOCS} className="hover:text-white">Docs</Link>
        <Link href="/blog" className="hover:text-white">Blog</Link>
        <Link href="/#agents" className="hover:text-white">Agents</Link>
        <Link href="/community" className="hover:text-white">Community</Link>
        <Link href="/substrate-calculator" className="hover:text-white">Substrate Calculator</Link>
        <Link href="/enterprise" className="hover:text-white">Enterprise</Link>
      </nav>
      <div className="flex gap-2">
        <a href={GITHUB} className="hidden rounded-full bg-ks-card2 px-4 py-2 text-sm sm:block">GitHub</a>
        <a href={START} className="rounded-full bg-white px-4 py-2 text-sm text-black">Get started</a>
      </div>
    </header>
  );
}

export function HomeFooter() {
  return (
    <footer className="border-t border-ks-line">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 py-10 text-sm text-ks-muted md:flex-row">
        <span>kagent and Agent Substrate are CNCF Sandbox projects.</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={DOCS} className="hover:text-white">Docs</Link>
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <a href={GITHUB} className="hover:text-white">GitHub</a>
          <a href={SUBSTRATE} className="hover:text-white">Agent Substrate</a>
          <Link href="/substrate-calculator" className="hover:text-white">Substrate Calculator</Link>
          <Link href="/community" className="hover:text-white">Community</Link>
          <Link href="/enterprise" className="hover:text-white">Enterprise</Link>
          <a href="https://discord.gg/Fu3k65f2k3" className="hover:text-white">Discord</a>
        </div>
      </div>
    </footer>
  );
}

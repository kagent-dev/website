'use client'
import Link from "next/link";
import { GITHUB_LINK } from "@/data/links";
import { useState } from "react";
import KagentLogoWithText from "./icons/kagent-logo-text";
import KagentLogo from "./icons/kagent-logo";
import KMCPIcon from "./icons/kmcpicon";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, ChevronDown, Github } from "lucide-react";
import { DocSearch } from "@docsearch/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/*
 * Marketing navbar — styled to match the Hugo/Hextra docs top nav so switching
 * between the marketing pages and /docs isn't jarring. Mirrors the docs nav's
 * layout (logo left; Docs dropdown + marketing links + search + GitHub icon +
 * theme toggle on the right), uniform gray link styling (no active bold/underline),
 * height, and light/dark colors. The docs nav is rendered by Hugo
 * (docs-site/layouts/_partials/navbar-link.html); keep the two visually in sync.
 */

// Uniform link styling — matches the docs nav (no active-state emphasis, since
// most links are cross-section and would rarely be "active" anyway).
const linkCls =
  "text-sm whitespace-nowrap text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200";

const marketingLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/tools", label: "Tools" },
  { href: "/agents", label: "Agents" },
  { href: "/community", label: "Community" },
  { href: "/enterprise", label: "Enterprise" },
];

// Docs products for the dropdown (mirrors the docs nav's kagent/kmcp menu).
const docsProducts = [
  { href: "/docs/kagent", label: "kagent", Icon: KagentLogo },
  { href: "/docs/kmcp", label: "kmcp", Icon: KMCPIcon },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-white/10 dark:bg-[#030712]">
      <div className="mx-auto flex h-24 max-w-[90rem] items-center gap-6 px-6">
        {/* Logo → home */}
        <Link href="/" className="mr-auto flex items-center transition-opacity hover:opacity-75">
          <KagentLogoWithText className="h-7" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Docs dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-1 outline-none ${linkCls}`}>
              Docs
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={10}
              className="min-w-[10.5rem] rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#111827]"
            >
              {docsProducts.map(({ href, label, Icon }) => (
                <DropdownMenuItem
                  key={href}
                  asChild
                  className="cursor-pointer rounded-md px-4 py-2 text-gray-600 focus:bg-gray-100 focus:text-gray-800 dark:text-gray-400 dark:focus:bg-neutral-800 dark:focus:text-gray-200"
                >
                  <Link href={href} className="flex items-center gap-3">
                    <span className="flex w-6 shrink-0 justify-end">
                      <Icon className="h-4 w-auto" />
                    </span>
                    <span>{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {marketingLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}

          <DocSearch
            appId="0Q0AZY5UR3"
            indexName="kagent"
            apiKey="fd2a6ceddf6d52e55495a46fc7b0a5db"
          />

          <Link
            href={GITHUB_LINK}
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            aria-label="GitHub"
            className={`flex items-center p-2 ${linkCls}`}
          >
            <Github className="h-5 w-5" />
          </Link>

          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#030712] md:hidden">
          <div className="flex flex-col">
            {docsProducts.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 py-2 ${linkCls}`}
              >
                <span className="flex w-6 shrink-0 justify-end">
                  <Icon className="h-4 w-auto" />
                </span>
                <span>Docs · {label}</span>
              </Link>
            ))}
            {marketingLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsMenuOpen(false)}
                className={`py-2 ${linkCls}`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={GITHUB_LINK}
              target="_blank"
              rel="noreferrer"
              className={`py-2 ${linkCls}`}
            >
              GitHub
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

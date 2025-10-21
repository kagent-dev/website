'use client'
import Link from "next/link";
import { GITHUB_LINK } from "@/data/links";
import { useState } from "react";
import { usePathname } from "next/navigation";
import KAgentLogoWithText from "./icons/kagent-logo-text";
import KagentLogo from "./icons/kagent-logo";
import KMCPIcon from "./icons/kmcpicon";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { DocSearch } from "@docsearch/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="py-4 md:py-8">
      <div className="w-full mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link href="/">
            <KAgentLogoWithText className="h-5" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <Button
              variant="link"
              className={`${
                isActive("/blog")
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href="/blog">Blog</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="link"
                  className={`flex items-center ${
                    pathname.startsWith("/docs")
                      ? "font-bold text-primary underline decoration-primary underline-offset-4"
                      : "text-secondary-foreground"
                  }`}
                >
                  Docs
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 shadow-md rounded-md py-2"
                align="start"
              >
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/docs/kagent")}
                  className={`flex items-center space-x-2 cursor-pointer transition-colors group ${
                    pathname.startsWith("/docs/kagent")
                      ? "font-bold text-primary underline decoration-primary underline-offset-4"
                      : "hover:bg-primary/10"
                  }`}
                >
                  <KagentLogo className="w-4 h-4 transition-colors group-hover:text-primary" />
                  <span>kagent</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/docs/kmcp")}
                  className={`flex items-center space-x-2 cursor-pointer transition-colors group ${
                    pathname.startsWith("/docs/kmcp")
                      ? "font-bold text-primary underline decoration-primary underline-offset-4"
                      : "hover:bg-primary/10"
                  }`}
                >
                  <KMCPIcon className="w-4 h-4 transition-colors group-hover:text-primary" />
                  <span>kMCP</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="link"
              className={`${
                isActive("/tools")
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href="/tools">Tools</Link>
            </Button>

            <Button
              variant="link"
              className={`${
                isActive("/agents")
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href="/agents">Agents</Link>
            </Button>

            <Button
              variant="link"
              className={`${
                isActive(GITHUB_LINK)
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href={GITHUB_LINK}>GitHub</Link>
            </Button>

            <Button
              variant="link"
              className={`${
                isActive("/community")
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href="/community">Community</Link>
            </Button>

            <Button
              variant="link"
              className={`${
                isActive("/enterprise")
                  ? "font-bold text-primary underline decoration-primary underline-offset-4"
                  : "text-secondary-foreground"
              }`}
              asChild
            >
              <Link href="/enterprise">Enterprise</Link>
            </Button>

            <DocSearch
              appId="0Q0AZY5UR3"
              indexName="kagent"
              apiKey="fd2a6ceddf6d52e55495a46fc7b0a5db"
            />

            <ThemeToggle />
            <Button variant="secondary" asChild>
              <Link href="/docs/kagent/getting-started/quickstart">
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 px-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive("/blog")
                    ? "font-bold text-primary underline decoration-white underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href="/blog">Blog</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`justify-start flex items-center ${
                      pathname.startsWith("/docs")
                        ? "font-bold text-primary underline decoration-primary underline-offset-4"
                        : ""
                    }`}
                  >
                    Docs
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 shadow-md rounded-md py-2"
                  align="start"
                >
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/docs/kagent")}
                    className={`flex items-center space-x-2 cursor-pointer transition-colors group ${
                      pathname.startsWith("/docs/kagent")
                        ? "font-bold text-primary underline decoration-primary underline-offset-4"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <KagentLogo className="w-4 h-4 transition-colors group-hover:text-primary" />
                    <span>KAgent</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/docs/kmcp")}
                    className={`flex items-center space-x-2 cursor-pointer transition-colors group ${
                      pathname.startsWith("/docs/kmcp")
                        ? "font-bold text-primary underline decoration-primary underline-offset-4"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <KMCPIcon className="w-4 h-4 transition-colors group-hover:text-primary" />
                    <span>KMCP</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive("/tools")
                    ? "font-bold text-primary underline decoration-primary underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href="/tools">Tools</Link>
              </Button>

              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive("/agents")
                    ? "font-bold text-primary underline decoration-primary underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href="/agents">Agents</Link>
              </Button>

              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive(GITHUB_LINK)
                    ? "font-bold text-primary underline decoration-white underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href={GITHUB_LINK}>GitHub</Link>
              </Button>

              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive("/community")
                    ? "font-bold text-primary underline decoration-white underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href="/community">Community</Link>
              </Button>

              <Button
                variant="ghost"
                className={`justify-start ${
                  isActive("/enterprise")
                    ? "font-bold text-primary underline decoration-white underline-offset-4"
                    : ""
                }`}
                asChild
              >
                <Link href="/enterprise">Enterprise</Link>
              </Button>

              <Button variant="secondary" className="mt-4" asChild>
                <Link href="/docs/kagent/getting-started/quickstart">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

'use client'
import Link from "next/link";
import { GITHUB_LINK } from "@/data/links";
import { useState } from "react";
import KAgentLogoWithText from "./icons/kagent-logo-text";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link href="/">
            <KAgentLogoWithText className="h-5" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
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
              <Link href="/community">Community</Link>
            </Button>
            <ThemeToggle />
            <Button variant="secondary" asChild>
              <Link href="/docs/getting-started/quickstart">Get Started</Link>
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
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/docs">Docs</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/tools">Tools</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/agents">Agents</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href={GITHUB_LINK}>GitHub</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/community">Community</Link>
              </Button>
              <Button variant="secondary" className="mt-4" asChild>
                <Link href="/docs/getting-started/quickstart">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
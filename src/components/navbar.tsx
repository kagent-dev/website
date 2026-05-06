'use client'
import Link from "next/link";
import { GITHUB_LINK } from "@/data/links";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import KagentLogoWithText from "./icons/kagent-logo-text";
import { ThemeToggle } from "./theme-toggle";
import { DocSearch } from "@docsearch/react";
import docsNavigation from "@/config/navigation.json";

const SITE_LINKS = [
  { title: 'Docs', href: '/docs/kagent' },
  { title: 'Blog', href: '/blog' },
  { title: 'Community', href: '/community' },
  { title: 'Enterprise', href: '/enterprise' },
];

const DOCS_LINKS = docsNavigation.map((section: { title: string; href: string }) => ({
  title: section.title,
  href: section.href,
}));

export default function Navbar() {
  const pathname = usePathname();
  const [stars, setStars] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const isDocsPage = pathname.startsWith('/docs/');

  useEffect(() => {
    fetch('https://api.github.com/repos/kagent-dev/kagent')
      .then(r => r.json())
      .then(d => {
        if (d.stargazers_count) {
          const c = d.stargazers_count;
          setStars(c >= 1000 ? `${(c / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(c));
        }
      })
      .catch(() => {});

    fetch('https://api.github.com/repos/kagent-dev/kagent/releases/latest')
      .then(r => r.json())
      .then(d => { if (d.tag_name) setVersion(d.tag_name); })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="navbar-new">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <KagentLogoWithText className="h-5" />
        </Link>

        {!isDocsPage && (
          <div className="navbar-site-links">
            {SITE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-site-link ${isActive(link.href) ? 'navbar-site-link-active' : ''}`}
              >
                {link.title}
              </Link>
            ))}
          </div>
        )}

        <div className="navbar-right">
          <DocSearch
            appId="0Q0AZY5UR3"
            indexName="kagent"
            apiKey="fd2a6ceddf6d52e55495a46fc7b0a5db"
          />

          {stars && (
            <Link
              href={GITHUB_LINK}
              className="navbar-chip"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
              <span className="navbar-chip-count">{stars}</span>
            </Link>
          )}

          {version && (
            <Link
              href={`${GITHUB_LINK}/releases/tag/${version}`}
              className="navbar-version"
              target="_blank"
              rel="noopener noreferrer"
            >
              {version}
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

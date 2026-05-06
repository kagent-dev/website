'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Background } from "@/components/background";
import { LabCTA } from "@/components/mdx/lab-cta";
import { LabsCarousel } from "@/components/mdx/labs-carousel";
import labs from "@/data/labs.yaml";

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
  external?: boolean;
}

interface DocsLayoutClientProps {
  navigation: NavItem[];
  children: React.ReactNode;
}

export default function DocsLayoutClient({ navigation, children }: DocsLayoutClientProps) {
  const pathname = usePathname();

  function initExpandedSections(nav: NavItem[], path: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    const match = (href: string) => path === href || path.startsWith(href + '/');
    const hasActive = (items?: NavItem[]): boolean => {
      if (!items) return false;
      return items.some(item => match(item.href) || hasActive(item.items));
    };
    nav.forEach(section => {
      result[section.title] = match(section.href) || hasActive(section.items);
      section.items?.forEach(item => {
        if (item.items?.length) {
          result[item.title] = match(item.href) || hasActive(item.items);
        }
      });
    });
    return result;
  }

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    initExpandedSections(navigation, pathname)
  );

  useEffect(() => {
    setExpandedSections(initExpandedSections(navigation, pathname));
  }, [pathname, navigation]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sectionContainsPage = (section: NavItem): boolean => {
    if (pathname === section.href) return true;
    if (section.items) {
      return section.items.some(item => {
        if (pathname === item.href || pathname.startsWith(item.href + '/')) return true;
        if (item.items) return item.items.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));
        return false;
      });
    }
    return false;
  };

  const activeSection = navigation.find(sectionContainsPage) || navigation[0];

  return (
    <>
      <Background />
      <div className="min-h-screen">
        {/* Section tabs — always visible at top */}
        <div className="docs-section-bar">
          <div className="docs-section-bar-inner">
            {navigation.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                className={`docs-section-tab ${sectionContainsPage(section) ? 'docs-section-tab-active' : ''}`}
              >
                {section.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-row min-h-[calc(100vh-256px)]">
          {/* Sidebar — always visible */}
          <div className="docs-sidebar w-64 flex-shrink-0 border-r border-white/10 overflow-y-auto">
            <nav className="px-3 py-6 space-y-1">
              <div className="font-bold text-sm uppercase tracking-wide text-primary mb-3">
                {activeSection.title}
              </div>
              {activeSection.items?.map((item) => (
                <div key={item.href}>
                  <div className="flex items-center justify-between">
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm py-1.5 px-2 rounded-md transition-colors font-medium text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-white/5"
                      >
                        {item.title}
                        <svg className="inline ml-1 opacity-50" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex-1 text-sm py-1.5 px-2 rounded-md transition-colors font-medium ${
                          isActive(item.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-white/5'
                        }`}
                        onClick={() => {
                          if (item.items?.length) toggleSection(item.title);
                        }}
                      >
                        {item.title}
                      </Link>
                    )}
                    {item.items && item.items.length > 0 && (
                      <button
                        onClick={() => toggleSection(item.title)}
                        className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
                        aria-label={`Toggle ${item.title}`}
                      >
                        {expandedSections[item.title] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                  {item.items && expandedSections[item.title] && (
                    <ul className="ml-4 mt-1 mb-2 space-y-0.5 border-l border-white/10 pl-2">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className={`block text-sm py-1 px-2 rounded-md transition-colors ${
                              isActive(sub.href)
                                ? 'text-primary font-medium bg-primary/5'
                                : 'text-secondary-foreground/60 hover:text-secondary-foreground hover:bg-white/5'
                            }`}
                          >
                            {sub.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="prose-lg p-4 md:p-8 lg:p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic overflow-x-hidden">
            {children}

            {labs?.labs && labs.labs.length > 1 ? (
              <LabsCarousel labs={labs.labs} />
            ) : labs?.labs?.length === 1 ? (
              <LabCTA
                title={labs.labs[0].title}
                description={labs.labs[0].description}
                href={labs.labs[0].href}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
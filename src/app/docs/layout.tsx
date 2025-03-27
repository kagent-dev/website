'use client'
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Introduction",
    href: "#",
    items: [
      { title: "What is kagent", href: "/docs/introduction/what-is-kagent" },
      { title: "Installation", href: "/docs/introduction/installation" },
      { title: "Feature Roadmap", href: "https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap" },
      { title: "Contributing", href: "https://github.com/kagent-dev/kagent/blob/main/CONTRIBUTION.md" },
    ],
  },
  {
    title: "Getting Started",
    href: "#",
    items: [
      { title: "Quick Start", href: "/docs/getting-started/quickstart" },
      { title: "Your First Agent", href: "/docs/getting-started/first-agent" },
      { title: "Writing System Prompts", href: "/docs/getting-started/system-prompts" },
      { title: "Configuring LLM Providers", href: "/docs/getting-started/configuring-providers" },

    ],
  },

  {
    title: "Core Concepts",
    href: "#",
    items: [
      { title: "Architecture", href: "/docs/concepts/architecture" },
      { title: "Agents", href: "/docs/concepts/agents" },
      { title: "Tools", href: "/docs/concepts/tools" },
    ],
  },
  {
    title: "Resources",
    href: "/docs/resources",
    items: [
      { title: "Troubleshooting", href: "/docs/resources/troubleshooting" },
      { title: "FAQs", href: "/docs/resources/faq" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-256px)]">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden sticky top-0 z-10 bg-background p-4 border-b flex justify-between items-center">
        <span className="font-bold">Documentation</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar} 
          className="p-1"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div 
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 flex-shrink-0 md:border-r border-white/10 overflow-y-auto`}
      >
        <nav className="px-4 md:px-6 py-6 md:py-16 space-y-6 md:space-y-8">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-sm mb-3 md:mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items?.map((item) => (
                  <li key={item.href}>
                    <Button 
                      variant="link" 
                      className="block text-sm py-1 text-secondary-foreground/70" 
                      asChild
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <Link href={item.href}>{item.title}</Link>
                    </Button>
                    {item.items && (
                      <ul className="ml-4 mt-2 space-y-2">
                        {item.items.map((subItem) => (
                          <li key={subItem.href}>
                            <Link 
                              href={subItem.href} 
                              className="block text-sm py-1 text-white/40 hover:text-white"
                              onClick={() => {
                                if (window.innerWidth < 768) {
                                  setSidebarOpen(false);
                                }
                              }}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="prose-lg p-4 md:p-8 lg:p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
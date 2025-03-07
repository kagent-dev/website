import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next/types";

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
      { title: "Feature Roadmap", href: "/docs/introduction/roadmap" },
      { title: "Contributing", href: "https://github.com/kagent-dev/kagent" },
    ],
  },
  {
    title: "Getting Started",
    href: "#",
    items: [
      { title: "Quick Start", href: "/docs/getting-started/quickstart" },
      { title: "Your First Agent", href: "/docs/getting-started/first-agent" },
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
      { title: "Examples", href: "/docs/resources/examples" },
      { title: "Troubleshooting", href: "/docs/resources/troubleshooting" },
      { title: "FAQs", href: "/docs/resources/faq" },
    ],
  },
];

export const metadata: Metadata = {
  title: "kagent | Documentation",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-256px)]">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <nav className="px-6 py-16 space-y-8">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items?.map((item) => (
                  <li key={item.href}>
                    <Button variant="link" className="block text-sm py-1 text-secondary-foreground/70" asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </Button>
                    {item.items && (
                      <ul className="ml-4 mt-2 space-y-2">
                        {item.items.map((subItem) => (
                          <li key={subItem.href}>
                            <Link href={subItem.href} className="block text-sm py-1 text-white/40 hover:text-white">
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

      <div className="prose-lg p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc">{children}</div>
    </div>
  );
}

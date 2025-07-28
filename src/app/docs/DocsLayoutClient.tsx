'use client'
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { Background } from "@/components/background";

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

interface DocsLayoutClientProps {
  navigation: NavItem[];
  children: React.ReactNode;
}

export default function DocsLayoutClient({ navigation, children }: DocsLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    navigation.forEach(section => {
      initial[section.title] = true;
      section.items?.forEach(item => {
        if (item.items && item.items.length > 0) {
          initial[item.title] = true;
        }
      });
    });
    return initial;
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const isActiveItem = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <Background />
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-256px)]">
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
            className={`${ sidebarOpen ? 'block' : 'hidden' } md:block w-full md:w-64 flex-shrink-0 md:border-r border-white/10 overflow-y-auto`}
          >
            <nav className="px-2 md:px-3 py-6 md:py-16 space-y-4 md:space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    {section.href ? (
                      <Link 
                        href={section.href}
                        className={`font-black text-lg hover:text-primary transition-colors flex-1 ${
                          isActiveItem(section.href) ? 'underline underline-offset-4' : ''
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        {section.title}
                      </Link>
                    ) : (
                      <h3 className="font-black text-base flex-1">{section.title}</h3>
                    )}
                    {section.items && section.items.length > 0 && (
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                        aria-label={`Toggle ${section.title} section`}
                      >
                        {expandedSections[section.title] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    )}
                  </div>
                  {expandedSections[section.title] && (
                    <ul className="space-y-2">
                      {section.items?.map((item) => (
                        <li key={item.href}>
                          <div className="flex items-center justify-between">
                            <Button 
                              variant="link" 
                              className={`flex-1 text-sm py-1 justify-start px-0 ${
                                isActiveItem(item.href) 
                                  ? 'text-secondary-foreground font-bold underline decoration-1 underline-offset-2' 
                                  : 'text-secondary-foreground/70 font-bold' 
                              }`}
                              asChild
                              onClick={() => {
                                if (window.innerWidth < 768) {
                                  setSidebarOpen(false);
                                }
                              }}
                            >
                              <Link href={item.href}>{item.title}</Link>
                            </Button>
                            {item.items && item.items.length > 0 && (
                              <button
                                onClick={() => toggleSection(item.title)}
                                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                                aria-label={`Toggle ${item.title} section`}
                              >
                                {expandedSections[item.title] ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            )}
                          </div>
                          {item.items && expandedSections[item.title] && (
                            <ul className="ml-4 mt-2 space-y-2">
                              {item.items.map((subItem) => (
                                <li key={subItem.href}>
                                  <Link 
                                    href={subItem.href} 
                                    className={`block text-sm py-1 hover:text-secondary-foreground ${
                                      isActiveItem(subItem.href)
                                        ? 'text-secondary-foreground underline decoration-1 underline-offset-2'
                                        : 'text-secondary-foreground/70'
                                    }`}
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
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="prose-lg p-4 md:p-8 lg:p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  );
} 
import React from "react";
import DocsLayoutClient from "./DocsLayoutClient";
import navigationData from "@/config/navigation.json";

interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
  external?: boolean;
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const navigation: NavItem[] = navigationData as NavItem[];

  return (
    <DocsLayoutClient navigation={navigation}>
      {children}
    </DocsLayoutClient>
  );
}
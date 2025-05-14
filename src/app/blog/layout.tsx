import React from "react";
import { Background } from "@/components/background";

interface BlogLayoutProps {
  children: React.ReactNode;
}

export default function BlogLayout({  children }: BlogLayoutProps) {
  return (
    <>
      <Background />
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-256px)]">

          <div className="prose-lg p-4 md:p-8 lg:p-16 flex-1 prose-li:marker:text-muted-foreground prose-ol:list-decimal prose-ul:list-disc prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:italic overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  );
} 
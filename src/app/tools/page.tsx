"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { categories } from "@/data/tools";
import { CategoryCard } from "@/components/category-card";

const ToolsRegistry = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.tools.some((tool) => tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-medium mb-4">Tools Registry</h1>
          <p className="text-muted-foreground text-lg mb-8">Discover and integrate AI-powered tools for your cloud-native operations</p>

          <div className="relative max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-2 h-5 w-5 text-primary" />
              <Input type="text" placeholder="Search categories and tools..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsRegistry;

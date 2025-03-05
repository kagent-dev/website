"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Check, Cog, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategory } from "@/data/tools";

const CategoryPage = () => {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const category = getCategory(categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/tools"
            className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to the registry
          </Link>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{category.icon}</span>
            <h1 className="text-3xl font-medium">{category.name}</h1>
          </div>
          <p className="text-muted-foreground text-lg mt-4">
            {category.description}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {category.tools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell className="font-medium">{tool.name}</TableCell>
                <TableCell className="max-w-md">{tool.description}</TableCell>
                <TableCell>
                  <span>
                    v{tool.stats.version}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {tool.builtin && (
                      <Badge variant="outline">
                        <Check className="w-3 h-3 mr-1" />
                        Built-in
                      </Badge>
                    )}
                    {tool.mcp && (
                      <Badge variant="outline">
                        <Cog className="w-3 h-3 mr-1" />
                        MCP
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoryPage;
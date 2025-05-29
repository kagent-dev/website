"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            href="/tools"
            className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to the registry
          </Link>
          <div className="flex items-center space-x-3">
            <span className="text-2xl sm:text-3xl">{category.icon}</span>
            <h1 className="text-2xl sm:text-3xl font-medium">{category.name}</h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
            {category.description}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell className="max-w-md">{tool.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {category.tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
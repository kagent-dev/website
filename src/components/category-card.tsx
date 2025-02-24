import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Category } from "@/data/tools";

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link href={`/tools/${category.id}`} className="block h-full transition-transform hover:scale-[1.02]">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">{category.icon}</span>
            <span>{category.name}</span>
            <span><Badge variant="secondary">{category.tools.length}</Badge></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <p className="text-muted-foreground flex-1">{category.description}</p>
          <div className="mt-4 flex items-center text-sm text-primary">
            View Tools <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
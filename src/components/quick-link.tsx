import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface QuickLinkProps {
    title: string;
    description: string;
    href: string;
  }
  
export default function QuickLink({ title, description, href }: QuickLinkProps) {
    return (
      <Link 
        href={href}
        className="block p-6 rounded-lg border border-primary/30 hover:border-primary/50 transition-colors"
      >
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-muted-foreground mt-2 text-base">{description}</p>
        <div className="flex items-center text-primary text-sm">
          Learn more <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </Link>
    );
  }
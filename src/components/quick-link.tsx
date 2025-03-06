"use client";
import { ArrowRight } from "lucide-react";

import { useRouter } from "next/navigation";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
interface QuickLinkProps {
  title: string;
  description: string;
  href: string;
}

export default function QuickLink({ title, description, href }: QuickLinkProps) {
  const router = useRouter();
  return (
    <Card className="bg-white/5 border-white/10 group hover:border-violet-500/50 hover:cursor-pointer" onClick={() => router.push(href)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="text-xs">
        Learn more <ArrowRight className="ml-2 h-4 w-4" />
      </CardFooter>
    </Card>
  );
}

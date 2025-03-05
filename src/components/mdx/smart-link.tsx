import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SmartLink({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith("http") || href?.startsWith("www");

  if (isExternal) {
    return (
      <a className="font-medium text-primary underline inline-flex items-center gap-1 hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer" href={href} {...props}>
        {children}
        <ExternalLink className="ml-1 h-4 w-4" />
      </a>
    );
  }

  return (
    <Link className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors" href={href} {...props}>
      {children}
    </Link>
  );
}

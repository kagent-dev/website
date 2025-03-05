import type { MDXComponents } from "mdx/types";
import { useMemo } from "react";
import { PlatformTabs } from "./components/mdx/platform-tabs";
import SmartLink from "./components/mdx/smart-link";
import { CodeBlock } from "./components/mdx/code-block";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return useMemo(
    () => ({
      // Headings
      h1: ({ children, ...props }) => (
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-8 mt-12 first:mt-0" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-6 mt-10" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4 mt-8" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 mt-6" {...props}>
          {children}
        </h4>
      ),
      // Paragraph
      p: ({ children, ...props }) => (
        <p className="leading-7 mb-6 text-muted-foreground" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }) => (
        <ul className="my-6 ml-6 list-disc" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="my-6 ml-6 list-decimal" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="text-muted-foreground list-item" {...props}>
          {children}
        </li>
      ),
      // Inline elements
      a: ({ children, ...props }) => <SmartLink {...props}>{children}</SmartLink>,
      strong: ({ children, ...props }) => (
        <strong className="font-semibold text-foreground" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic text-foreground" {...props}>
          {children}
        </em>
      ),
      code: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
      // Block elements
      blockquote: ({ children, ...props }) => (
        <blockquote className="mt-6 border-l-4 border-primary pl-6 italic text-muted-foreground" {...props}>
          {children}
        </blockquote>
      ),
      hr: (props) => <hr className="my-8 border-muted" {...props} />,
      // Tables
      table: ({ children, ...props }) => (
        <div className="my-6 w-full overflow-y-auto">
          <table className="w-full border-collapse text-sm" {...props}>
            {children}
          </table>
        </div>
      ),
      tr: ({ children, ...props }) => (
        <tr className="border-b border-muted transition-colors hover:bg-muted/50" {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="p-4 align-middle text-muted-foreground" {...props}>
          {children}
        </td>
      ),
      // Pre (for code blocks)
      pre: ({ children }) => (<>{children}</>),
      PlatformTabs,
      ...components,
    }),
    [components]
  );
}

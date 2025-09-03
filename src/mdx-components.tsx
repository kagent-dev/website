import type { MDXComponents } from "mdx/types";
import { useMemo } from "react";
import { PlatformTabs } from "./components/mdx/platform-tabs";
import { Tabs } from "./components/mdx/tabs";
import SmartLink from "./components/mdx/smart-link";
import { CodeBlock } from "./components/mdx/code-block";
import Image from "next/image";
import { generateAnchorId } from "@/lib/utils";

function YouTube ({ id } : { id : string }){
  return (
    <div>
      <iframe
        className="aspect-video w-full"
        src={"https://www.youtube.com/embed/" + id}
        title="YouTube Video Player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    </div>
  );
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return useMemo(
    () => ({
      // Headings
      h1: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h1 id={id} className="scroll-m-20 text-4xl font-bold tracking-tight mb-8 mt-12 first:mt-0 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h1>
        );
      },
      h2: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h2 id={id} className="scroll-m-20 text-3xl font-semibold tracking-tight mb-6 mt-10 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h3 id={id} className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4 mt-8 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h3>
        );
      },
      h4: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h4 id={id} className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 mt-6 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h4>
        );
      },
      h5: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h5 id={id} className="scroll-m-20 text-lg font-semibold tracking-tight mb-3 mt-6 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h5>
        );
      },
      h6: ({ children, ...props }) => {
        const text = typeof children === 'string' ? children : '';
        const id = generateAnchorId(text);
        return (
          <h6 id={id} className="scroll-m-20 text-base font-semibold tracking-tight mb-3 mt-6 text-foreground group" {...props}>
            {children}
            <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
              #
            </a>
          </h6>
        );
      },
      // Paragraph
      p: ({ children, ...props }) => (
        <p className="leading-7 mb-6 text-muted-foreground" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }) => (
        <ul className="my-6 ml-6 list-disc text-foreground" {...props}>
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
      blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
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
      img: ({ ...props }) => (
        <figure>
          <Image src={props.src} alt={props.title} width="0" height="0" sizes="100vw" className="w-full h-auto" />
          {props.title && <figcaption className="text-xs text-center italic">{props.title}</figcaption>}
        </figure>
      ),
      // Pre (for code blocks)
      pre: ({ children }) => <>{children}</>,
      PlatformTabs,
      Tabs,
      YouTube,
      ...components,
    }),
    [components]
  );
}

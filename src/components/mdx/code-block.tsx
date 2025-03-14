'use client'
import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Check, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ children, language = 'typescript', className }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!language || !className) {
    return <code className='font-mono'>{children}</code>
  }

  return (
    <div className={`relative rounded-lg ${className}`}>
      <div className="absolute right-4 top-4">
        <button
          onClick={handleCopy}
          className="p-2 rounded-md"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-violet-500/50 hover:text-violet-500 transition-colors" />
          )}
        </button>
      </div>
      <Highlight
        theme={resolvedTheme === 'dark' ? themes.jettwaveDark : themes.jettwaveLight}
        code={children.trim()}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto p-4 text-sm rounded-lg`}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">

                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
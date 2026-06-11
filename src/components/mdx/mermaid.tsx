'use client';

import { useEffect, useId, useRef } from 'react';
import { useTheme } from 'next-themes';
import mermaid from 'mermaid';

function withTransparentFills(svg: string): string {
  const idMatch = svg.match(/\sid="([^"]+)"/);
  if (!idMatch) return svg;

  const svgId = idMatch[1];
  const transparentRects = svg.replace(
    /<rect\b([^>]*?)\sfill="[^"]*"/g,
    '<rect$1 fill="transparent"',
  );
  const override = `
#${svgId} .node rect,#${svgId} .node polygon,#${svgId} .node circle,#${svgId} .node path,
#${svgId} .cluster rect,#${svgId} .cluster path,#${svgId} [data-look="neo"] rect,#${svgId} [data-look="neo"] path,
#${svgId} .cluster>*,#${svgId} .internal>*,#${svgId} .external>*,#${svgId} .edgeLabel rect{fill:transparent!important;}
`;

  return transparentRects.replace('</style>', `${override}</style>`);
}

export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    let cancelled = false;
    const theme = resolvedTheme === 'dark' ? 'dark' : 'neutral';

    mermaid.initialize({ startOnLoad: false, theme });
    mermaid
      .render(`${id}-${theme}`, chart)
      .then(({ svg }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = withTransparentFills(svg);
        }
      })
      .catch(() => {
        if (!cancelled && ref.current) ref.current.innerHTML = '';
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  return <div ref={ref} className="mermaid-diagram" />;
}
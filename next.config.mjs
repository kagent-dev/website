/** @type {import('next').NextConfig} */

import createMDX from "@next/mdx";
import { fileURLToPath } from 'node:url'

const remarkVersionSubstitutionPath = fileURLToPath(
  new URL('./scripts/remark-version-substitution.mjs', import.meta.url)
)

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      // Short install URL for the kagent CLI:
      //   curl -sL https://kagent.dev/install | bash
      // Temporary (307) so clients never cache it and the target can move.
      // `curl -L` follows it; the script itself picks the release to install.
      {
        source: '/install',
        destination:
          'https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent',
        permanent: false,
      },
      // Order matters: Next applies the first matching redirect. These two name
      // a page that also moved section, so the catch-all below would send them
      // to a 0.x path that does not exist (there is no 0.x/getting-started/
      // tracing). Keep them above it, pointing straight at the real 0.x page
      // rather than chaining through a second redirect.
      {
        source: '/docs/getting-started/configuring-providers',
        destination: '/docs/kagent/0.x/supported-providers',
        permanent: true,
      },
      {
        source: '/docs/kagent/getting-started/tracing',
        destination: '/docs/kagent/0.x/observability/tracing',
        permanent: true,
      },
      // At 1.0.0 the 1.x tree was renamed latest/ (and copied to main/), but
      // 1.x URLs were already published during the alphas and release
      // candidates. latest/ keeps the 1.x paths one-for-one, so the rest of the
      // path carries over unchanged. Keep this above the catch-all, which no
      // longer exempts 1.x.
      {
        source: '/docs/kagent/1.x/:path*',
        destination: '/docs/kagent/latest/:path*',
        permanent: true,
      },
      // The kagent docs became versioned and every pre-1.0 page moved under
      // 0.x/, so all 106 published URLs changed. The negative lookahead
      // exempts paths that already carry a version segment: without it
      // /docs/kagent/0.x/... would match and redirect onto itself forever, and
      // main/ and latest/ would be sent into 0.x. /docs/kagent does not match
      // and stays the version picker.
      //
      // The destination stays 0.x after 1.0. Every unversioned URL was a 0.x
      // page, and the 1.x information architecture does not match it
      // path-for-path, so retargeting would land readers on 404s. The same
      // holds for the two redirects above.
      //
      // `+` on both sides is required for paths deeper than one segment. With a
      // plain `:path`, `next dev` redirects them fine, but OpenNext (the
      // Cloudflare runtime) compiles the destination with path-to-regexp's
      // per-segment validation and throws on the slash in
      // "supported-providers/byo-openai", so the page returns a 500.
      {
        source: '/docs/kagent/:path((?!(?:0\\.x|main|latest)(?:/|$)).+)+',
        destination: '/docs/kagent/0.x/:path+',
        permanent: true,
      },
      // The kmcp CLI reference pages moved from reference/ into reference/cli/.
      {
        source: '/docs/kmcp/reference/:cmd(kmcp-[^/]+)',
        destination: '/docs/kmcp/reference/cli/:cmd',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: 'yaml-loader',
    });
    return config;
  },
  turbopack: {
    rules: {
      '*.yaml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
      '*.yml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};


const withMDX = createMDX({
  options: {
    // Turbopack requires serializable options: plugins as name/path strings
    remarkPlugins: ['remark-frontmatter', 'remark-gfm', remarkVersionSubstitutionPath],
    rehypePlugins: ['rehype-unwrap-images'],
  },
})
 
// Merge MDX config with Next.js config
export default withMDX(nextConfig)
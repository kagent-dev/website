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
      // The kagent docs became versioned and every pre-1.0 page moved under
      // 0.x/, so all 106 published URLs changed. The negative lookahead
      // exempts paths that already carry a version segment: without it
      // /docs/kagent/0.x/... would match and redirect onto itself forever.
      // /docs/kagent does not match and stays the version picker.
      {
        source: '/docs/kagent/:path((?!0\\.x|1\\.x).*)',
        destination: '/docs/kagent/0.x/:path',
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
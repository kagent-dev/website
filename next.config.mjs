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
      {
        source: '/docs/getting-started/configuring-providers',
        destination: '/docs/kagent/supported-providers',
        permanent: true,
      },
      {
        source: '/docs/kagent/getting-started/tracing',
        destination: '/docs/kagent/observability/tracing',
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
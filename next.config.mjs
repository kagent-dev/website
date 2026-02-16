/** @type {import('next').NextConfig} */

import createMDX from "@next/mdx";
import rehypeUnwrapImages from 'rehype-unwrap-images'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

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
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [rehypeUnwrapImages],
  },
})
 
// Merge MDX config with Next.js config
export default withMDX(nextConfig)
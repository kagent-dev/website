/** @type {import('next').NextConfig} */

import createMDX from "@next/mdx";
import rehypeUnwrapImages from 'rehype-unwrap-images'
import remarkFrontmatter from 'remark-frontmatter'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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
    remarkPlugins: [remarkFrontmatter],
    rehypePlugins: [rehypeUnwrapImages],
  },
})
 
// Merge MDX config with Next.js config
export default withMDX(nextConfig)
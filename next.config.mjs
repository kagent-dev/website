/** @type {import('next').NextConfig} */

import createMDX from "@next/mdx";
import rehypeUnwrapImages from 'rehype-unwrap-images'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};


const withMDX = createMDX({
  options: {
    rehypePlugins: [rehypeUnwrapImages],
  },
})
 
// Merge MDX config with Next.js config
export default withMDX(nextConfig)
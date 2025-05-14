import { readdir } from 'fs/promises';

interface Post {
    slug: string;
    title: string;
    description: string;
    authorId: string;
    tags: string[];
    publishDate: string;
    author: string;
}

export async function getPost(slug: string): Promise<Post> {
    const { metadata } = await import(`../blogContent/${slug}.mdx`);
    return { slug, ...metadata };
}

export async function getPosts(): Promise<Post[]> {
    const slugs = (
        await readdir('./src/blogContent/', { withFileTypes: true })
    ).filter((dirent) => dirent.isFile() && dirent.name.endsWith('.mdx'));

    // Retrieve metadata from MDX files
    const posts = await Promise.all(
        slugs.map(async ({ name }) => {
            const { metadata } = await import(`../blogContent/${name}`);
            // Slug should be without the .mdx extension
            const slug = name.replace('.mdx', '');
            return { slug, ...metadata };
        })
    );

    // Sort posts from newest to oldest
    posts.sort((a, b) => +new Date(b.publishDate) - +new Date(a.publishDate));

    return posts;
}
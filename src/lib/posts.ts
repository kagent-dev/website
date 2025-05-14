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

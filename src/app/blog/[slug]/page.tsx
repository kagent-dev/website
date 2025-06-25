import { getAuthorById, Author } from '../authors';
import Link from 'next/link';
import Image from 'next/image';

function AuthorComponent({ authors }: { authors: Author[] }) {
    return <div className="w-full max-w-sm p-4 bg-card rounded-lg">
        {authors.map((author) => (
            <div key={author.id} className="flex flex-col items-center text-center">
                <Image src={author.photo} alt={author.name} width={128} height={128} className="w-32 h-32 rounded-full mb-4 shadow-lg border-[#942DE7] border-2 object-cover" />
                <div className="text-xl font-semibold text-card-foreground">{author.name}</div>
                <div className="text-sm text-muted-foreground italic">{author.title}</div>
                <div className="text-sm text-muted-foreground mt-10">{author.bio}</div>
            </div>
        ))}
    </div>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { metadata } = await import(`@/blogContent/${slug}.mdx`);
    return {
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
    }
}

export default async function Page({
    params,
  }: {
    params: Promise<{ slug: string }>
  }) {
    const { slug } = await params;
    const { default: Post, metadata } = await import(`@/blogContent/${slug}.mdx`);

    let postAuthors: Author[] = [];
    if (metadata && metadata.authorIds && Array.isArray(metadata.authorIds)) {
      postAuthors = metadata.authorIds
        .map((id: string) => getAuthorById(id))
        .filter((author: Author | undefined): author is Author => author !== undefined);
    }
    return <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <Link href="/blog" className="text-primary hover:underline inline-flex items-center">
                <span aria-hidden="true" className="mr-1">←</span> Back to Blog
            </Link>
        </div>
        <div className="flex flex-col lg:flex-row lg:space-x-8">
            <div className="lg:w-3/4">
                <article className="prose lg:prose-xl max-w-none">
                    <Post />
                </article>
            </div>
            <aside className="lg:w-1/4">
                <AuthorComponent authors={postAuthors} />
            </aside>
        </div>
    </div>
  }

import { Background } from "@/components/background";
import { getPosts } from "@/lib/posts";
import Link from "next/link";
import React from "react";

function shortDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export  default async function BlogPage() {
    const posts = await getPosts();
  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-16 text-foreground">Blog</h1>
          <div className="space-y-12 md:space-y-16">
            {posts.map((post) => (
                <div key={post.slug} className="py-4">
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                        <span>{shortDate(post.publishDate)}</span>
                    </div>
                    <div className="mt-5 text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                        <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors duration-200">{post.title}</Link>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-base">{post.description}</p>
                    <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline text-sm inline-flex items-center">
                        Read the post <span aria-hidden="true" className="ml-1">→</span>
                    </Link>
                </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 
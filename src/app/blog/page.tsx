import { Background } from "@/components/background";
import Link from "next/link";
import React from "react";
import externalPostsData from "@/data/external-blog-posts.yaml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthorById, type Author } from "./authors";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import Discord from "@/components/icons/discord";
import Github from "@/components/icons/github";

function shortDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const posts = [
    {
        slug: 'reactive-agents-khook',
        publishDate: '2025-09-09',
        title: "Truly Reactive Cloud Native AI Agents with Kagent and Khook",
        description: "Khook makes Kagent Agents Reactive",
        authorId: "antweiss",
    },
    {
        slug: 'ai-reliability-aire',
        publishDate: '2025-05-14',
        title: 'AI Reliability Engineering For More Dependable Humans',
        description: 'AI Reliability Engineering (AIRE) brings AI agents to SRE and Platform Engineering workflows for dependable humans.',
        authorId: "christianposta",
    },
    {
        slug: 'kgateway-guardrails',
        publishDate: '2025-05-19',
        title: 'Adding Guardrails to kagent with kgateway AI Gateway',
        description: 'Adding guardrails, observability, and security to Agent to LLM communication with an AI gateway like kgateway',
        authorId: "christianposta",
    },
    {
        slug: 'kagent-celebrating-100-days',
        publishDate: '2025-07-01',
        title: 'Celebrating 100 Days of Kagent',
        description: '100+ contributors, 1000+ GitHub stars and more!',
        authorId: "linsun",
    },
    {
        slug: 'kmcp',
        publishDate: '2025-07-30',
        title: 'From MCP Servers to Services: Introducing kmcp for Enterprise-Grade MCP Development',
        description: 'Discover kmcp, the lightweight toolkit that takes MCP servers from prototype to production. Learn how to scaffold, build, and deploy enterprise-grade MCP services to Kubernetes in minutes—no Dockerfiles or complex manifests required. Includes demo video and complete getting started guide.',
        authorId: "christianposta",
    }
]

type InternalPostCombined = {
    title: string;
    description: string;
    publishDate: string;
    href: string;
    isExternal: false;
    slug: string;
    author: Author | null;
}

type ExternalPostCombined = {
    title: string;
    description: string;
    publishDate: string;
    href: string;
    isExternal: true;
    author: string; // Keep as string for external posts since they're not in our authors.ts
}

type CombinedPost = InternalPostCombined | ExternalPostCombined;

type ExternalYamlPost = { title: string; description: string; publishDate: string; url: string; author: string };

export default async function BlogPage() {
    return (
        <>
            <Background />
            <div className="min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center mb-16 text-foreground">Blog</h1>
                    <div className="space-y-12 md:space-y-16">
                        {(() => {
                            const internalPosts: InternalPostCombined[] = posts.map(p => ({
                                title: p.title,
                                description: p.description,
                                publishDate: p.publishDate,
                                href: `/blog/${p.slug}`,
                                isExternal: false as const,
                                slug: p.slug,
                                author: getAuthorById(p.authorId) || null,
                            }));
                            const rawExternal: ExternalYamlPost[] = (externalPostsData && (externalPostsData as { externalPosts?: ExternalYamlPost[] }).externalPosts) || [];
                            const externalPosts: ExternalPostCombined[] = rawExternal.map((p: ExternalYamlPost) => ({
                                title: p.title,
                                description: p.description,
                                publishDate: p.publishDate,
                                href: p.url,
                                isExternal: true as const,
                                author: p.author,
                            }));
                            const allPosts: CombinedPost[] = [...internalPosts, ...externalPosts].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
                            return allPosts.map((post) => (
                                <div key={post.isExternal ? post.href : post.slug} className="py-4">
                                    <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                                        <span>{shortDate(post.publishDate)}</span>
                                        {post.isExternal && <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">External</Badge>}
                                    </div>
                                    <div className="mt-5 text-3xl lg:text-4xl font-bold mb-3 text-foreground">
                                        {post.isExternal ? (
                                            <a href={post.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors duration-200">{post.title}</a>
                                        ) : (
                                            <Link href={post.href} className="hover:text-primary transition-colors duration-200">{post.title}</Link>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-foreground/70 mb-4 italic">
                                        by {post.isExternal ? post.author : post.author ? `${post.author.name}, ${post.author.title}` : 'Unknown Author'}
                                    </div>
                                    <p className="text-muted-foreground mb-4 leading-relaxed text-lg font-normal">{post.description}</p>
                                    {post.isExternal ? (
                                        <a href={post.href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline text-sm inline-flex items-center">
                                            Read the post <span aria-hidden="true" className="ml-1">→</span>
                                        </a>
                                    ) : (
                                        <Link href={post.href} className="text-primary font-medium hover:underline text-sm inline-flex items-center">
                                            Read the post <span aria-hidden="true" className="ml-1">→</span>
                                        </Link>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
                
                {/* Community Section */}
                <div className="py-16 border-t border-border">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-medium mb-8 text-foreground">
                            Join our <span className="text-primary font-semibold">community</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
                            Connect with other developers, share your experiences, and get support from the kagent community.
                        </p>
                        <div className="flex justify-center space-x-6">
                            <Button size="lg" className="text-base px-6 py-3">
                                <Discord className="mr-2 h-5 w-5" />
                                <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                                    Discord
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="text-base px-6 py-3">
                                <Github className="mr-2 h-5 w-5" />
                                <Link href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                                    GitHub
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 
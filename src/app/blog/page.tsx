import { Background } from "@/components/background";
import Link from "next/link";
import React from "react";

function shortDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const posts = [
    {
        slug: 'ai-reliability-aire',
        publishDate: '2025-05-14',
        title: 'AI Reliability Engineering For More Dependable Humans',
        description: 'AI Reliability Engineering (AIRE) brings AI agents to SRE and Platform Engineering workflows for dependable humans.',
    },
    {
        slug: 'kgateway-guardrails',
        publishDate: '2025-05-19',
        title: 'Adding Guardrails to kagent with kgateway AI Gateway',
        description: 'Adding guardrails, observability, and security to Agent to LLM communication with an AI gateway like kgateway',
    },
    {
        slug: 'kagent-celebrating-100-days',
        publishDate: '2025-07-01',
        title: 'Celebrating 100 Days of Kagent',
        description: '100+ contributors, 1000+ GitHub stars and more!',
    },
    {
        slug: 'kmcp',
        publishDate: '2025-07-30',
        title: 'From MCP Servers to Services: Introducing kmcp for Enterprise-Grade MCP Development',
        description: 'Discover kmcp, the lightweight toolkit that takes MCP servers from prototype to production. Learn how to scaffold, build, and deploy enterprise-grade MCP services to Kubernetes in minutes—no Dockerfiles or complex manifests required. Includes demo video and complete getting started guide.',
    }
]

export default async function BlogPage() {
    return (
        <>
            <Background />
            <div className="min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center mb-16 text-foreground">Blog</h1>
                    <div className="space-y-12 md:space-y-16">
                        {posts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((post) => (
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
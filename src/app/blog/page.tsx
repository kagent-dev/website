import Link from "next/link";
import React from "react";
import externalPostsData from "@/data/external-blog-posts.yaml";
import { getAuthorById } from "./authors";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import Discord from "@/components/icons/discord";
import Github from "@/components/icons/github";
import { BlogIndex, type BlogCardPost, type Category } from "@/components/blog/blog-index";

const posts: { slug: string; publishDate: string; title: string; description: string; authorId: string; category: Category; image?: string }[] = [
    {
        slug: 'kagent-policies-ui-egress-policy-walkthrough',
        image: '/images/blog/thumbnails/kagent-policies-ui-egress-policy-walkthrough.webp',
        publishDate: '2026-11-24',
        title: 'kagent Has a Policies Page Now: A Walkthrough of Egress Policies in the Open Source UI',
        description: 'The open source kagent UI has a Policies page for EgressPolicy, the allow-list that decides which HTTP(S) hosts a sandboxed agent can reach on Agent Substrate. A walkthrough of every screen, the three authentication modes, and a live test from inside a sandbox: blocked, allowed, then blocked again, with no restart.',
        authorId: 'sebastianmaniak',
        category: 'Feature',
    },
    {
        slug: 'kagent-cve-agent-substrate-secure-sandbox',
        image: '/images/blog/thumbnails/kagent-cve-agent-substrate-secure-sandbox.webp',
        publishDate: '2026-11-24',
        title: 'Build a CVE Agent with kagent and Agent Substrate in a Secure Sandbox',
        description: 'An agent that tracks vulnerabilities has to read the internet, which makes it the agent you least want running loose in your cluster. Build cve-watch the safe way: one egress policy for www.cisa.gov, one agent, and one schedule, running in a gVisor sandbox with default-deny egress on Agent Substrate.',
        authorId: 'sebastianmaniak',
        category: 'Tutorial',
    },
    {
        slug: 'personal-ai-assistant-kagent-agent-substrate',
        image: '/images/blog/thumbnails/personal-ai-assistant-kagent-agent-substrate.webp',
        publishDate: '2026-11-24',
        title: 'Build a Personal AI Assistant with kagent and Agent Substrate',
        description: 'A hands-on tutorial: build a personal AI assistant in the kagent UI with a personality, a weather tool, and a morning routine. Along the way, see why Agent Substrate is the engine underneath: it sandboxes the assistant, suspends it when it waits, and resumes it on the next message.',
        authorId: 'sebastianmaniak',
        category: 'Tutorial',
    },
    {
        slug: 'install-agent-substrate-any-cluster',
        image: '/images/blog/thumbnails/install-agent-substrate-any-cluster.webp',
        publishDate: '2026-11-11',
        title: 'Install Agent Substrate on Any Kubernetes Cluster',
        description: 'Agentic infrastructure shouldn\'t be tied to one cloud. The universal kubectl-ate installer sets up Agent Substrate on any Kubernetes cluster, including Kind, Minikube, AKS, EKS, and GKE, with no cloud-specific workarounds.',
        authorId: 'michaellevan',
        category: 'Tutorial',
    },
    {
        slug: 'anthropic-self-managed-sandboxes',
        image: '/images/blog/thumbnails/anthropic-self-managed-sandboxes.webp',
        publishDate: '2026-11-07',
        title: 'Anthropic Self-Hosted Sandboxes with kagent',
        description: 'kagent lets you run Anthropic self-hosted sandboxes on your own infrastructure.',
        authorId: 'stevenjin8',
        category: 'Integration',
    },
    {
        slug: 'kagent-v1-0-release',
        image: '/images/blog/thumbnails/kagent-v1-0-release.webp',
        publishDate: '2026-11-09',
        title: 'kagent 1.0 Is Here: Open Source Agents on Agent Substrate',
        description: 'kagent 1.0 is out, and every agent now runs on Agent Substrate: sandboxed by default, suspended when idle, and resumed on the next message. Why Pods don\'t fit agents, what Substrate and kagent each do, and how to get started.',
        authorId: 'sebastianmaniak',
        category: 'Release',
    },
    {
        slug: 'agent-sandboxes-four-axes',
        image: '/images/blog/thumbnails/agent-sandboxes-four-axes.webp',
        publishDate: '2026-10-27',
        title: 'Not All Agent Sandboxes Are Created Equally',
        description: 'Discobox, OpenShell, E2B, SPACE, Agent Substrate, and other agent sandboxes make very different assumptions. This post introduces four axes for comparing them: boundary and access controls, environment, lifecycle, and interface and experience.',
        authorId: 'christianposta',
        category: 'Deep Dive',
    },
    {
        slug: 'kagent-agent-substrate-sandboxes',
        image: '/images/blog/thumbnails/kagent-agent-substrate-sandboxes.webp',
        publishDate: '2026-09-21',
        title: 'Kagent and Agent Substrate: Running AI Agent Sandboxes on Kubernetes',
        description: "Isolation, security, and scale are what stand between an agent demo and an agent in production. Here is how Agent Substrate sandboxes agents with gVisor and microVMs, and how to run those sandboxed agents with kagent.",
        authorId: 'michaellevan',
        category: 'Deep Dive',
    },
    {
        slug: 'blacksmith-ci',
        publishDate: '2026-09-04',
        title: 'Next generation CI using Blacksmith',
        description: 'Life of a maintainer: How we cut our CI time by 1/3 using Blacksmith',
        authorId: 'eitanya',
        category: 'Deep Dive',
    },
    {
        slug: 'agents-on-every-cloud',
        image: '/images/blog/thumbnails/agents-on-every-cloud.webp',
        publishDate: '2026-08-27',
        title: 'Agents on Every Cloud',
        description: 'The open source distributions of kagent and agentgateway are now on the AWS, Azure, and Google Cloud marketplaces. Deploy both and connect them: from install to an agent served through agentgateway over A2A.',
        authorId: 'petrmcallister',
        category: 'Announcement',
    },
    {
        slug: 'dnb-kagent-agentgateway',
        image: '/images/blog/thumbnails/dnb-kagent-agentgateway.webp',
        publishDate: '2026-07-13',
        title: 'How One Platform Team Scaled AI Adoption with Kagent and Agentgateway',
        description: 'Lin spoke with David Karlsen and Ibrahim Umar from DNB about their journey adopting kagent and agentgateway',
        authorId: 'linsun',
        category: 'Community',
    },
    {
        slug: 'deploy-kagent-with-agent-substrate',
        image: '/images/blog/thumbnails/deploy-kagent-with-agent-substrate.webp',
        publishDate: '2026-07-13',
        title: 'Code Share: Deploy kagent with Agent Substrate',
        description: 'Agent sessions are bursty and idle most of the time. Agent Substrate multiplexes gVisor-sandboxed actors onto a small pool of warm workers with sub-second suspend/resume. This guide explains the model, the use cases, and how to stand up kagent OSS with substrate on a kind cluster.',
        authorId: 'sebastianmaniak',
        category: 'Tutorial',
    },
    {
        slug: 'community-nginx-khook-kagent',
        image: '/images/blog/thumbnails/community-nginx-khook-kagent.webp',
        publishDate: '2025-10-15',
        title: 'Community Spotlight: Automated Nginx Troubleshooting with Kagent and Khook',
        description: 'How the community is using Kagent and Khook to automate Nginx troubleshooting tasks.',
        authorId: "antweiss",
        category: "Community",
    },
    {
        slug: "crewai-byo-agent",
        image: "/images/blog/thumbnails/crewai-byo-agent.webp",
        publishDate: "2025-10-30",
        title: "From CrewAI to KAgent: Deploying Your Custom AI Agents",
        description:
        "Learn how to take your existing CrewAI agents and deploy them as Bring-Your-Own (BYO) agents in KAgent.",
        authorId: "jetchiang",
        category: "Tutorial",
    },
    {
        slug: 'reactive-agents-khook',
        image: '/images/blog/thumbnails/reactive-agents-khook.webp',
        publishDate: '2025-09-09',
        title: "Truly Reactive Cloud Native AI Agents with Kagent and Khook",
        description: "Khook makes Kagent Agents Reactive",
        authorId: "antweiss",
        category: "Feature",
    },
    {
        slug: 'ai-reliability-aire',
        publishDate: '2025-05-14',
        title: 'AI Reliability Engineering For More Dependable Humans',
        description: 'AI Reliability Engineering (AIRE) brings AI agents to SRE and Platform Engineering workflows for dependable humans.',
        authorId: "christianposta",
        category: "Deep Dive",
    },
    {
        slug: 'kgateway-guardrails',
        image: '/images/blog/thumbnails/kgateway-guardrails.webp',
        publishDate: '2025-05-19',
        title: 'Adding Guardrails to kagent with kgateway AI Gateway',
        description: 'Adding guardrails, observability, and security to Agent to LLM communication with an AI gateway like kgateway',
        authorId: "christianposta",
        category: "Integration",
    },
    {
        slug: 'kagent-celebrating-100-days',
        image: '/images/blog/thumbnails/kagent-celebrating-100-days.webp',
        publishDate: '2025-07-01',
        title: 'Celebrating 100 Days of Kagent',
        description: '100+ contributors, 1000+ GitHub stars and more!',
        authorId: "linsun",
        category: "Community",
    },
    {
        slug: 'kmcp',
        publishDate: '2025-07-30',
        title: 'From MCP Servers to Services: Introducing kmcp for Enterprise-Grade MCP Development',
        description: 'Discover kmcp, the lightweight toolkit that takes MCP servers from prototype to production. Learn how to scaffold, build, and deploy enterprise-grade MCP services to Kubernetes in minutes—no Dockerfiles or complex manifests required. Includes demo video and complete getting started guide.',
        authorId: "christianposta",
        category: "Announcement",
    },
    {
        slug: 'human-in-the-loop-kagent',
        publishDate: '2026-03-11',
        title: 'Human-in-the-Loop with kagent: Keeping Humans in Control of AI Agents',
        description: 'How to build Kubernetes-native AI agents that pause and ask for approval before taking destructive actions, using kagent\'s human-in-the-loop capabilities.',
        authorId: 'sebastianmaniak',
        category: 'Feature',
    },
    {
        slug: 'go-vs-python-runtime',
        publishDate: '2026-03-12',
        title: 'We Added a Go Runtime to kagent and the Numbers Are Wild',
        description: 'We benchmarked kagent\'s Go and Python agent runtimes on image size, startup time, and memory. The results: 11x smaller images, 6.7x faster startup, and 36x less memory.',
        authorId: 'eitanya',
        category: 'Deep Dive',
    },
    {
        slug: 'inside-kagent-oss-ent-ai-meshes',
        publishDate: '2025-11-18',
        title: 'Inside Kagent: Architecting Open Source and Enterprise AI Agent Meshes for 2026',
        description: 'Learn how to architect open source and enterprise AI agent meshes for 2026.',
        authorId: "michaellevan",
        category: "Deep Dive",
    },
    {
        slug: 'kagent-v0-9-1-release',
        publishDate: '2026-05-04',
        title: "kagent v0.9.1 — What's New in Kubernetes-Native Agentic AI",
        description: 'kagent v0.9.1 brings AWS Bedrock support for Claude with extended thinking, REST API secret management, sidecar container support, Git-based skill configuration, and a configurable Helm runtime.',
        authorId: 'sebastianmaniak',
        category: 'Release',
    },
    {
        slug: 'nemoclaw-kagent-sandbox-secure-production-imp',
        image: '/images/blog/thumbnails/nemoclaw-kagent-sandbox-secure-production-imp.webp',
        publishDate: '2026-05-07',
        title: 'NemoClaw + Kagent + Sandbox: The Secure, Production Grade Implementation',
        description: 'Learn how to bridge the gap between Agent client, sandbox, and what the enterprise needs for security, governance, and observability with kagent, nemoclaw, and openshell',
        authorId: 'michaellevan',
        category: 'Integration',
    },
    {
        slug: 'is-pod-right-deployment-unit-ai-agent',
        image: '/images/blog/thumbnails/is-pod-right-deployment-unit-ai-agent.webp',
        publishDate: '2026-06-25',
        title: 'Is a Pod the Right Deployment Unit for an AI Agent?',
        description: 'How kagent evolved from one runtime hosting many agents to agent-substrate—and why Pods may be the right execution unit, but not the right deployment model, for AI agents.',
        authorId: 'linsun',
        category: 'Deep Dive',
    },
    {
        slug: 'the-future-of-kagent',
        publishDate: '2026-08-10',
        title: 'The future of kagent',
        description: 'Thousands of agents per cluster, resuming in milliseconds, sandboxed by default. kagent is rebuilding its runtime on Agent Substrate to get there.',
        authorId: 'eitanya',
        category: 'Announcement',
    }
]

type ExternalYamlPost = { title: string; description: string; publishDate: string; url: string; author: string; category?: Category };

export default async function BlogPage() {
    const internalPosts: BlogCardPost[] = posts.map((p) => {
        const author = getAuthorById(p.authorId);
        return {
            title: p.title,
            description: p.description,
            publishDate: p.publishDate,
            href: `/blog/${p.slug}`,
            isExternal: false,
            category: p.category,
            image: p.image,
            authorName: author?.name ?? "Unknown Author",
            authorPhoto: author?.photo,
        };
    });
    const rawExternal: ExternalYamlPost[] = (externalPostsData && (externalPostsData as { externalPosts?: ExternalYamlPost[] }).externalPosts) || [];
    // External posts are community write-ups unless the YAML says otherwise.
    const externalPosts: BlogCardPost[] = rawExternal.map((p) => ({
        title: p.title,
        description: p.description,
        publishDate: p.publishDate,
        href: p.url,
        isExternal: true,
        category: p.category ?? "Community",
        authorName: p.author,
    }));
    const allPosts = [...internalPosts, ...externalPosts].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return (
        <div className="not-prose">
            {/* Full-bleed dot pattern behind the header and hero; it anchors to the blog layout's root. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1.5px)] bg-[length:24px_24px] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
            />

            <section className="pb-10 pt-6 md:pb-14 md:pt-10">
                <h1 className="mb-4 text-[2.75rem] font-semibold leading-tight tracking-tight text-white lg:text-[4.0625rem]">Blog</h1>
                <p className="max-w-2xl text-lg leading-relaxed text-ks-muted lg:text-2xl">
                    Tutorials, deep dives, and releases from the kagent community.
                </p>
            </section>

            <BlogIndex posts={allPosts} />

            <section className="mt-16 rounded-2xl border border-ks-line bg-ks-card px-6 py-12 text-center md:mt-24 md:py-16">
                <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white">
                    Join our <span className="text-ks-accent">community</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-ks-muted">
                    Connect with other developers, share your experiences, and get support from the kagent community.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90">
                        <Discord className="h-4 w-4" />
                        Discord
                    </Link>
                    <Link href={GITHUB_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ks-card2 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10">
                        <Github className="h-4 w-4" />
                        GitHub
                    </Link>
                </div>
            </section>
        </div>
    );
}

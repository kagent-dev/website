"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const CATEGORIES = [
  "Announcement",
  "Community",
  "Deep Dive",
  "Feature",
  "Integration",
  "Release",
  "Tutorial",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type BlogCardPost = {
  title: string;
  description: string;
  publishDate: string;
  href: string;
  isExternal: boolean;
  category: Category;
  /* A 1200x630 thumbnail under /images/blog/thumbnails. Posts without one get the generated cover. */
  image?: string;
  authorName: string;
  authorPhoto?: string;
};

const BADGE: Record<Category, string> = {
  Announcement: "bg-purple-500/15 text-purple-300",
  Community: "bg-amber-500/15 text-amber-300",
  "Deep Dive": "bg-rose-500/15 text-rose-300",
  Feature: "bg-blue-500/15 text-blue-300",
  Integration: "bg-indigo-500/15 text-indigo-300",
  Release: "bg-cyan-500/15 text-cyan-300",
  Tutorial: "bg-green-500/15 text-green-300",
};

/* Publish dates are plain YYYY-MM-DD, so format them in UTC: the server and the browser then agree. */
function shortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/* The post's thumbnail, or a generated cover so every card has one without a per-post image. */
function Cover({ post }: { post: BlogCardPost }) {
  if (post.image) {
    return (
      <div className="relative mb-5 aspect-[800/420] overflow-hidden rounded-xl border border-white/10 bg-ks-card2">
        {/* Thumbnails are pre-sized, so skip the image optimizer. */}
        <Image
          src={post.image}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="relative mb-5 flex aspect-[800/420] flex-col overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,#4c1d95_0%,#1e1033_45%,#0d0816_100%)] p-5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1.5px)] bg-[length:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-white/90">
          <Image src="/images/kagent-logo-mark.png" alt="" width={18} height={18} />
          kagent
        </span>
        {post.isExternal && (
          <span className="truncate rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-geistmono text-[10px] uppercase tracking-wider text-white/60">
            {hostname(post.href)}
          </span>
        )}
      </div>
      <div className="relative mt-auto line-clamp-3 text-balance text-lg font-semibold leading-snug tracking-tight text-white">
        {post.title}
      </div>
    </div>
  );
}

function Card({ post }: { post: BlogCardPost }) {
  const linkProps = post.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const Arrow = post.isExternal ? ArrowUpRight : ArrowRight;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-ks-line bg-ks-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)] md:p-7">
      <Cover post={post} />

      <div className="mb-4">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${BADGE[post.category]}`}>
          {post.category}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2.5 text-sm font-medium text-ks-muted">
        {post.authorPhoto && (
          <Image
            src={post.authorPhoto}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
        )}
        <span>{post.authorName}</span>
        <span className="opacity-50">•</span>
        <time dateTime={post.publishDate}>{shortDate(post.publishDate)}</time>
      </div>

      <h2 className="mb-3 text-xl font-semibold leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-violet-300 md:text-2xl">
        {/* The stretched ::after makes the whole card the link target. */}
        <Link href={post.href} {...linkProps} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-violet-400">
          {post.title}
        </Link>
      </h2>

      <p className="mb-6 line-clamp-3 text-base leading-relaxed text-ks-muted">{post.description}</p>

      <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-ks-accent transition-all duration-200 group-hover:gap-3">
        {post.isExternal ? `Read on ${hostname(post.href)}` : "Read full article"}
        <Arrow className="h-4 w-4" />
      </span>
    </article>
  );
}

export function BlogIndex({ posts }: { posts: BlogCardPost[] }) {
  const [active, setActive] = useState<Category | "All">("All");

  const filters = ["All" as const, ...CATEGORIES.filter((c) => posts.some((p) => p.category === c))];
  const visible = active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      <div role="group" aria-label="Filter posts by category" className="mb-8 flex flex-wrap gap-2 md:mb-10 md:gap-3">
        {filters.map((f) => {
          const on = f === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(f)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                on
                  ? "border-transparent bg-violet-500 text-white"
                  : "border-ks-line bg-ks-card text-white/70 hover:border-violet-400/60 hover:text-white"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {visible.map((post) => (
          <Card key={post.href} post={post} />
        ))}
      </div>
    </>
  );
}

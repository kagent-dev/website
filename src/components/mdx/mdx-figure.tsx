"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { cn } from "@/lib/utils"

const MdxFigureLightbox = dynamic(
  () =>
    import("./mdx-figure-lightbox").then((mod) => ({
      default: mod.MdxFigureLightbox,
    })),
  { ssr: false }
)

type MdxFigureProps = React.ImgHTMLAttributes<HTMLImageElement>

export function MdxFigure({
  src,
  alt = "",
  title,
  className,
  style,
}: MdxFigureProps) {
  const [open, setOpen] = React.useState(false)
  const [hasOpened, setHasOpened] = React.useState(false)

  if (!src || typeof src !== "string") {
    return null
  }

  const caption = title
  const label = alt || (typeof caption === "string" ? caption : "") || "documentation image"

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setHasOpened(true)
    }
  }

  const hasLayoutOverride = className != null || style != null

  return (
    <figure className={cn(hasLayoutOverride && className)} style={hasLayoutOverride ? style : undefined}>
      <button
        type="button"
        className={cn(
          "block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
          hasLayoutOverride && "mx-0"
        )}
        aria-label={`View larger image: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => handleOpenChange(true)}
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className="h-auto w-full"
          loading="lazy"
        />
      </button>
      {hasOpened ? (
        <MdxFigureLightbox
          open={open}
          onOpenChange={handleOpenChange}
          src={src}
          alt={alt}
          label={label}
        />
      ) : null}
      {caption ? (
        <figcaption className="text-xs text-center italic">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

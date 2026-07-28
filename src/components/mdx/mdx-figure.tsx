"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MDX_IMAGE_SIZE_STYLES,
  resolveMdxImageSize,
  type MdxImageSize,
} from "@/config/mdx-image-sizes"

const MdxFigureLightbox = dynamic(
  () =>
    import("./mdx-figure-lightbox").then((mod) => ({
      default: mod.MdxFigureLightbox,
    })),
  { ssr: false }
)

type MdxFigureProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  size?: MdxImageSize
}

export function MdxFigure({
  src,
  alt = "",
  title,
  className,
  style,
  size,
}: MdxFigureProps) {
  const pathname = usePathname()
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
  const resolvedSize = resolveMdxImageSize(src, pathname, size)
  const figureStyle = hasLayoutOverride ? style : MDX_IMAGE_SIZE_STYLES[resolvedSize]

  return (
    <figure className={cn("mx-auto", className)} style={figureStyle}>
      <button
        type="button"
        className="block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
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

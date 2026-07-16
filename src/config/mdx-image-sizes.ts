import type { CSSProperties } from "react"

export type MdxImageSize = "default" | "compact" | "large"

export const MDX_IMAGE_SIZE_STYLES: Record<MdxImageSize, CSSProperties> = {
  default: {
    width: "75%",
    minWidth: "280px",
    maxWidth: "800px",
  },
  compact: {
    width: "65%",
    minWidth: "260px",
    maxWidth: "640px",
  },
  large: {
    width: "90%",
    minWidth: "300px",
    maxWidth: "960px",
  },
}

/** Whole-page default when all markdown images on a path should differ. */
export const PAGE_IMAGE_SIZES: Record<string, MdxImageSize> = {
  "/docs/kagent/examples/slack-a2a": "compact",
  "/docs/kmcp/quickstart": "large",
}

/** Per-image override (e.g. hero diagrams larger than their page preset). */
export const IMAGE_SIZE_BY_SRC: Record<string, MdxImageSize> = {
  "/images/slack-a2a/slack-a2a-kagent.png": "large",
  "/images/discord-a2a/discord-a2a-kagent.png": "large",
}

export function resolveMdxImageSize(
  src: string | undefined,
  pathname: string | null,
  explicitSize?: MdxImageSize
): MdxImageSize {
  if (explicitSize) {
    return explicitSize
  }
  if (src && IMAGE_SIZE_BY_SRC[src]) {
    return IMAGE_SIZE_BY_SRC[src]
  }
  if (pathname && PAGE_IMAGE_SIZES[pathname]) {
    return PAGE_IMAGE_SIZES[pathname]
  }
  return "default"
}

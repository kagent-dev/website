"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export type MdxFigureLightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  alt: string
  label: string
}

export function MdxFigureLightbox({
  open,
  onOpenChange,
  src,
  alt,
  label,
}: MdxFigureLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto max-h-[90vh] max-w-[min(96vw,1200px)] gap-0 overflow-hidden p-0 motion-reduce:animate-none sm:max-w-[min(96vw,1200px)] [&>button]:z-[60]">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="px-4 pb-4 pt-12">
          {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs intrinsic image sizing */}
          <img
            src={src}
            alt={alt}
            className="mx-auto block h-auto max-h-[min(80vh,85dvh)] w-auto max-w-[min(92vw,1160px)] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

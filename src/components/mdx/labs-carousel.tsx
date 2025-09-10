"use client"

import * as React from "react"
import { LabCTA } from "@/components/mdx/lab-cta"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface LabItem {
  id: string
  title: string
  description: string
  href: string
}

interface LabsCarouselProps {
  labs: LabItem[]
}

export function LabsCarousel({ labs }: LabsCarouselProps) {
  const [index, setIndex] = React.useState(0)
  const hasMultiple = labs?.length > 1

  const goPrev = () => setIndex((prev) => (prev - 1 + labs.length) % labs.length)
  const goNext = () => setIndex((prev) => (prev + 1) % labs.length)

  if (!labs || labs.length === 0) return null

  const current = labs[index]

  return (
    <div className="mt-10">
      <div className="relative">
        {hasMultiple && (
          <div className="absolute -top-10 right-0 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous lab">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next lab">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <LabCTA title={current.title} description={current.description} href={current.href} />
      </div>

      {hasMultiple && (
        <div className="mt-4 flex justify-center gap-2">
          {labs.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default LabsCarousel



"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import KagentLogo from "@/components/icons/kagent-logo"

export interface LabCTAProps {
  title: string
  description: string
  href: string
  ctaLabel?: string
}

export function LabCTA({ title, description, href, ctaLabel = "Start the Lab" }: LabCTAProps) {
  return (
    <Card className="relative mt-16 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <CardHeader className="px-8 pt-14 pb-8">
        <div className="flex items-start gap-6">
          <div className="flex items-center justify-center text-primary">
            <KagentLogo animate width={100} height={75} aria-hidden="true" />
          </div>
          <div className="max-w-2xl">
            <CardTitle className="text-2xl leading-tight">{title}</CardTitle>
            <CardDescription className="mt-2 text-base leading-relaxed">
              {description}
            </CardDescription>
            <div className="mt-4 hidden sm:block">
              <Button size="lg" className="shadow-lg" asChild>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {ctaLabel}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 sm:hidden">
        <Button size="lg" className="w-full shadow-lg" asChild>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {ctaLabel}
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

export default LabCTA



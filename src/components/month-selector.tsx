"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
  month: string
  onPrevious?: () => void
  onNext?: () => void
}

export function MonthSelector({ month, onPrevious, onNext }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrevious}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground tabular-nums w-16 text-center">
        {month}
      </span>
      <button
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

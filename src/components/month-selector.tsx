"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
  month: string
  onPrevious?: () => void
  onNext?: () => void
  size?: "sm" | "lg"
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parseMonth(month: string): { year: string; monthEn: string } | null {
  const match = month.match(/(\d{4})年(\d{1,2})月/)
  if (!match) return null
  return {
    year: match[1],
    monthEn: MONTHS_EN[parseInt(match[2]) - 1] ?? "",
  }
}

export function MonthSelector({ month, onPrevious, onNext, size = "sm" }: MonthSelectorProps) {
  const parsed = parseMonth(month)

  if (size === "lg") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          className="flex h-9 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-start px-1">
          <span className="text-2xl font-medium tracking-widest uppercase text-foreground leading-tight">
            {parsed?.monthEn ?? month}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums tracking-wide">
            {parsed?.year}
          </span>
        </div>
        <button
          onClick={onNext}
          className="flex h-9 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

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
        {parsed ? `${parsed.monthEn} ${parsed.year}` : month}
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

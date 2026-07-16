"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthSelectorProps {
  month: string
  onPrevious?: () => void
  onNext?: () => void
  size?: "sm" | "lg"
}

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

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
  const isLg = size === "lg"

  return (
    <div className="flex items-baseline gap-4">
      <button
        onClick={onPrevious}
        className="text-muted-foreground/80 transition-colors hover:text-foreground"
        aria-label="Previous month"
      >
        <ChevronLeft className={cn(isLg ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.5} />
      </button>
      <span
        className={cn(
          "font-serif tracking-[0.04em] text-foreground",
          isLg ? "text-[34px] leading-none" : "text-xl leading-none"
        )}
      >
        {parsed?.monthEn ?? month}{" "}
        <span className={cn("text-muted-foreground/90", isLg ? "text-[22px]" : "text-sm")}>
          {parsed?.year}
        </span>
      </span>
      <button
        onClick={onNext}
        className="text-muted-foreground/80 transition-colors hover:text-foreground"
        aria-label="Next month"
      >
        <ChevronRight className={cn(isLg ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.5} />
      </button>
    </div>
  )
}

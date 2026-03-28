import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/data"

interface SummaryCardProps {
  label: string
  amount: number
  type?: "income" | "expense" | "balance" | "neutral"
  large?: boolean
}

export function SummaryCard({ label, amount, type = "neutral", large = false }: SummaryCardProps) {
  const colorClass = {
    income: "text-income",
    expense: "text-expense",
    balance: "text-foreground",
    neutral: "text-foreground",
  }[type]

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-6",
        large && "p-8 md:p-10"
      )}
    >
      <p className={cn(
        "text-muted-foreground",
        large ? "text-sm tracking-wide" : "text-xs tracking-wide uppercase"
      )}>
        {label}
      </p>
      <div className={cn(
        "flex items-baseline gap-1.5 mt-3",
        large && "mt-4"
      )}>
        <span className={cn(
          "text-muted-foreground/60",
          large ? "text-xl" : "text-sm"
        )}>
          ¥
        </span>
        <span
          className={cn(
            "font-light tracking-tight tabular-nums",
            colorClass,
            large ? "text-5xl md:text-6xl" : "text-2xl md:text-3xl"
          )}
        >
          {formatNumber(Math.abs(amount))}
        </span>
      </div>
    </div>
  )
}

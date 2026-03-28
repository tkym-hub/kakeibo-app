import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Transaction } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/data"
import { cn } from "@/lib/utils"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-wide uppercase text-muted-foreground">
          最近の取引
        </p>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          すべて表示
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-2xl bg-card divide-y divide-border/50">
        {recent.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-base">
                  {transaction.icon ?? "📦"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  transaction.type === "income" ? "text-income" : "text-foreground"
                )}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { transactions, categories, accounts, formatCurrency, formatDate, groupTransactionsByDate } from "@/lib/data"
import { cn } from "@/lib/utils"
import { SlidersHorizontal, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState("2026年4月")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredTransactions = transactions.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false
    if (accountFilter !== "all" && t.account !== accountFilter) return false
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    return true
  })

  const groupedTransactions = groupTransactionsByDate(filteredTransactions)
  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all" || typeFilter !== "all"

  const clearFilters = () => {
    setCategoryFilter("all")
    setAccountFilter("all")
    setTypeFilter("all")
  }

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            History
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {currentMonth}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  showFilters || hasActiveFilters
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label="フィルタ"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <MonthSelector month={currentMonth} />
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-wide uppercase text-muted-foreground">
                絞り込み
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  クリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="種類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="income">収入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="カテゴリ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="口座" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.icon} {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-6">
          {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => (
            <div key={date}>
              <p className="text-xs tracking-wide text-muted-foreground mb-3 px-1">
                {formatDate(date)}
              </p>
              <div className="rounded-2xl bg-card divide-y divide-border/50">
                {dayTransactions.map((transaction) => {
                  const category = categories.find((c) => c.name === transaction.category)
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-base">
                          {category?.icon || ""}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {transaction.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {transaction.account}
                            {transaction.memo && ` · ${transaction.memo}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          transaction.type === "income"
                            ? "text-income"
                            : "text-foreground"
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {groupedTransactions.size === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">該当する明細がありません</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { SummaryCard } from "@/components/summary-card"
import { CategoryChart } from "@/components/category-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { getTransactions, getCurrentMonth } from "@/lib/data"
import { Transaction } from "@/lib/types"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
]

function shiftMonth(month: string, delta: number): string {
  const match = month.match(/(\d{4})年(\d{1,2})月/)
  if (!match) return month
  const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1 + delta)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTransactions(currentMonth)
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [currentMonth])

  const monthlyData = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0)
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0)
    const balance = income - expense
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0

    const categoryMap: Record<string, number> = {}
    for (const t of transactions.filter((t) => t.type === "expense")) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
    }
    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])
    const top5 = sorted.slice(0, 5)
    const otherTotal = sorted.slice(5).reduce((s, [, v]) => s + v, 0)

    const categoryBreakdown = [
      ...top5.map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i] })),
      ...(otherTotal > 0
        ? [{ name: "その他", value: otherTotal, fill: CHART_COLORS[5] }]
        : []),
    ]

    return { income, expense, balance, savingsRate, categoryBreakdown }
  }, [transactions])

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            Overview
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {currentMonth}
            </h1>
            <MonthSelector
              month={currentMonth}
              onPrevious={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
              onNext={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <>
            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-6">
                <SummaryCard
                  label="今月の収支"
                  amount={monthlyData.balance}
                  type="balance"
                  large
                />
                <div className="grid grid-cols-2 gap-4">
                  <SummaryCard label="収入" amount={monthlyData.income} type="income" />
                  <SummaryCard label="支出" amount={monthlyData.expense} type="expense" />
                </div>
                <div className="flex items-center justify-between py-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">貯蓄率</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-light tracking-tight text-foreground tabular-nums">
                      {monthlyData.savingsRate}
                    </span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <CategoryChart data={monthlyData.categoryBreakdown} />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-12">
              <RecentTransactions transactions={transactions} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

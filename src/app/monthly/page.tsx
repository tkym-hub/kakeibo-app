"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { formatCurrency, accounts, transactions } from "@/lib/data"
import { cn } from "@/lib/utils"

const FIXED_EXPENSE_CATEGORIES = new Set(["住居費", "通信費", "光熱費", "保険料"])
const INVESTMENT_CATEGORIES = new Set(["投資"])

interface SectionProps {
  title: string
  total: number
  items: { name: string; amount: number }[]
  type?: "income" | "expense" | "investment"
}

function Section({ title, total, items, type = "expense" }: SectionProps) {
  const colorClass = {
    income: "text-income",
    expense: "text-foreground",
    investment: "text-primary",
  }[type]

  return (
    <div className="rounded-2xl bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs tracking-wide uppercase text-muted-foreground">{title}</span>
        <span className={cn("text-lg tabular-nums font-light", colorClass)}>
          {formatCurrency(total)}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <span className="text-sm tabular-nums text-foreground">
              {formatCurrency(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MonthlyDetailsPage() {
  const [currentMonth, setCurrentMonth] = useState("2026年4月")

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const match = prev.match(/(\d{4})年(\d{1,2})月/)
      if (!match) return prev
      const date = new Date(parseInt(match[1]), parseInt(match[2]) - 2)
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const match = prev.match(/(\d{4})年(\d{1,2})月/)
      if (!match) return prev
      const date = new Date(parseInt(match[1]), parseInt(match[2]))
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    })
  }

  const monthlyBreakdown = useMemo(() => {
    const match = currentMonth.match(/(\d{4})年(\d{1,2})月/)
    if (!match) return null
    const year = parseInt(match[1])
    const month = parseInt(match[2])

    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })

    const groupByCategory = (txs: typeof transactions) => {
      const grouped = txs.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})
      return Object.entries(grouped).map(([name, amount]) => ({ name, amount }))
    }

    const incomeTxs = monthTransactions.filter((t) => t.type === "income")
    const expenseTxs = monthTransactions.filter((t) => t.type === "expense")
    const investmentTxs = expenseTxs.filter((t) => INVESTMENT_CATEGORIES.has(t.category))
    const fixedTxs = expenseTxs.filter((t) => FIXED_EXPENSE_CATEGORIES.has(t.category))
    const variableTxs = expenseTxs.filter(
      (t) => !FIXED_EXPENSE_CATEGORIES.has(t.category) && !INVESTMENT_CATEGORIES.has(t.category)
    )

    return {
      income: {
        total: incomeTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(incomeTxs),
      },
      fixedExpenses: {
        total: fixedTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(fixedTxs),
      },
      variableExpenses: {
        total: variableTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(variableTxs),
      },
      investments: {
        total: investmentTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(investmentTxs),
      },
    }
  }, [currentMonth])

  if (!monthlyBreakdown) return null

  const totalExpense = monthlyBreakdown.fixedExpenses.total + monthlyBreakdown.variableExpenses.total
  const balance = monthlyBreakdown.income.total - totalExpense - monthlyBreakdown.investments.total

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            Monthly Report
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              {currentMonth}
            </h1>
            <MonthSelector
              month={currentMonth}
              onPrevious={handlePreviousMonth}
              onNext={handleNextMonth}
            />
          </div>
        </header>

        {/* Summary Bar */}
        <div className="grid grid-cols-4 gap-4 mb-10 py-6 border-y border-border/50">
          <div className="text-center">
            <p className="text-[10px] tracking-wide uppercase text-muted-foreground mb-1">収入</p>
            <p className="text-base md:text-lg font-light tabular-nums text-income">
              {formatCurrency(monthlyBreakdown.income.total)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] tracking-wide uppercase text-muted-foreground mb-1">支出</p>
            <p className="text-base md:text-lg font-light tabular-nums text-foreground">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] tracking-wide uppercase text-muted-foreground mb-1">投資</p>
            <p className="text-base md:text-lg font-light tabular-nums text-primary">
              {formatCurrency(monthlyBreakdown.investments.total)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] tracking-wide uppercase text-muted-foreground mb-1">収支</p>
            <p className={cn(
              "text-base md:text-lg font-light tabular-nums",
              balance >= 0 ? "text-income" : "text-expense"
            )}>
              {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Section
            title="収入"
            total={monthlyBreakdown.income.total}
            items={monthlyBreakdown.income.items}
            type="income"
          />
          <Section
            title="固定費"
            total={monthlyBreakdown.fixedExpenses.total}
            items={monthlyBreakdown.fixedExpenses.items}
            type="expense"
          />
          <Section
            title="変動費"
            total={monthlyBreakdown.variableExpenses.total}
            items={monthlyBreakdown.variableExpenses.items}
            type="expense"
          />
          <Section
            title="投資"
            total={monthlyBreakdown.investments.total}
            items={monthlyBreakdown.investments.items}
            type="investment"
          />
        </div>

        {/* Account Balances */}
        <div className="mt-10">
          <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
            口座残高
          </p>
          <div className="rounded-2xl bg-card divide-y divide-border/50">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{account.icon}</span>
                  <span className="text-sm text-foreground">{account.name}</span>
                </div>
                <span className="text-sm tabular-nums text-foreground">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

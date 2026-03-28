"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { SummaryCard } from "@/components/summary-card"
import { CategoryChart } from "@/components/category-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { monthlyData, transactions } from "@/lib/data"

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(monthlyData.month)

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
            <MonthSelector month={currentMonth} />
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column - Summary */}
          <div className="lg:col-span-3 space-y-6">
            {/* Balance - Hero Card */}
            <SummaryCard
              label="今月の収支"
              amount={monthlyData.balance}
              type="balance"
              large
            />

            {/* Income & Expense */}
            <div className="grid grid-cols-2 gap-4">
              <SummaryCard
                label="収入"
                amount={monthlyData.income}
                type="income"
              />
              <SummaryCard
                label="支出"
                amount={monthlyData.expense}
                type="expense"
              />
            </div>

            {/* Savings Rate - Minimal */}
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

          {/* Right Column - Chart */}
          <div className="lg:col-span-2">
            <CategoryChart data={monthlyData.categoryBreakdown} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-12">
          <RecentTransactions transactions={transactions} />
        </div>
      </div>
    </AppLayout>
  )
}

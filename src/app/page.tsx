"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { getTransactions, getCurrentMonth, shiftMonth, formatCurrency, formatNumber, formatDate } from "@/lib/data"
import { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

const TREND_MONTHS = 6

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function toMonthLabel(month: string): string {
  const match = month.match(/\d{4}年(\d{1,2}月)/)
  return match ? match[1] : month
}

function parseMonth(month: string): { year: string; monthEn: string } | null {
  const match = month.match(/(\d{4})年(\d{1,2})月/)
  if (!match) return null
  return {
    year: match[1],
    monthEn: MONTHS_EN[parseInt(match[2]) - 1] ?? "",
  }
}

interface TrendDataPoint {
  month: string
  income: number
  expense: number
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stale = false
    setLoading(true)

    const months = Array.from({ length: TREND_MONTHS }, (_, i) =>
      shiftMonth(currentMonth, -(TREND_MONTHS - 1 - i))
    )

    Promise.all(months.map((m) => getTransactions(m))).then((results) => {
      if (stale) return

      // Current month transactions (last in the array)
      setTransactions(results[TREND_MONTHS - 1])

      // Build trend data for all 6 months
      const trend: TrendDataPoint[] = months.map((month, i) => {
        const nonTransfer = results[i].filter((t) => !t.transfer_pair_id)
        const income = nonTransfer
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0)
        const expense = nonTransfer
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0)
        return { month: toMonthLabel(month), income, expense }
      })
      setTrendData(trend)
      setLoading(false)
    }).catch(() => {
      if (!stale) setLoading(false)
    })

    return () => {
      stale = true
    }
  }, [currentMonth])

  const monthlyData = useMemo(() => {
    const nonTransfer = transactions.filter((t) => !t.transfer_pair_id)
    const income = nonTransfer
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0)
    const expense = nonTransfer
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0)
    const balance = income - expense
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0

    const categoryMap: Record<string, number> = {}
    const categoryIconMap: Record<string, string> = {}
    for (const t of nonTransfer.filter((t) => t.type === "expense")) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
      if (!categoryIconMap[t.category]) categoryIconMap[t.category] = t.icon ?? "📦"
    }
    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])
    const top5 = sorted.slice(0, 5)
    const otherTotal = sorted.slice(5).reduce((s, [, v]) => s + v, 0)
    const maxValue = top5.length > 0 ? top5[0][1] : 0

    const categoryBreakdown = [
      ...top5.map(([name, value]) => ({
        name,
        value,
        icon: categoryIconMap[name] ?? "📦",
        percentage: maxValue > 0 ? Math.round((value / maxValue) * 100) : 0,
        muted: false,
      })),
      ...(otherTotal > 0
        ? [{
            name: "その他",
            value: otherTotal,
            icon: "📦",
            percentage: maxValue > 0 ? Math.round((otherTotal / maxValue) * 100) : 0,
            muted: true,
          }]
        : []),
    ]

    return { income, expense, balance, savingsRate, categoryBreakdown }
  }, [transactions])

  const heroMonth = useMemo(() => parseMonth(currentMonth) ?? { year: "", monthEn: currentMonth }, [currentMonth])

  const monthAbbrs = useMemo(() => {
    const months = Array.from({ length: TREND_MONTHS }, (_, i) =>
      shiftMonth(currentMonth, -(TREND_MONTHS - 1 - i))
    )
    return months.map((m) => parseMonth(m)?.monthEn.slice(0, 3) ?? "")
  }, [currentMonth])

  const sparkline = useMemo(() => {
    const values = trendData.map((d) => d.expense)
    const n = values.length
    if (n === 0) {
      return { linePoints: "", areaPoints: "", last: null as { x: number; y: number } | null }
    }
    const max = Math.max(...values)
    const min = Math.min(...values)
    const stepX = n > 1 ? 240 / (n - 1) : 0
    const points = values.map((v, i) => {
      const x = i * stepX
      const y = max === min ? 32 : 58 - ((v - min) / (max - min)) * 50
      return { x, y }
    })
    const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ")
    const areaPoints = `${linePoints} 240,64 0,64`
    return { linePoints, areaPoints, last: points[points.length - 1] }
  }, [trendData])

  const recentTransactions = transactions.slice(0, 3)

  return (
    <AppLayout>
      <div className="max-w-[1180px] mx-auto pt-3 px-4 pb-8 md:px-8">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <>
            {/* Hero panel */}
            <div className="rounded-md bg-panel text-panel-foreground grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10 pt-11 px-6 pb-10 md:pt-[52px] md:px-[56px] md:pb-12">
              {/* Left: expense */}
              <div>
                <div className="flex items-center gap-4 mb-9">
                  <button
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                    className="opacity-50 transition-opacity hover:opacity-80"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <span className="font-serif text-[20px] tracking-[0.14em] uppercase">
                    {heroMonth.monthEn} {heroMonth.year}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                    className="opacity-50 transition-opacity hover:opacity-80"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-[12px] tracking-[0.12em] opacity-65 mb-2">今月の支出</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-serif text-[32px] opacity-55" style={{ fontWeight: 300 }}>
                    ¥
                  </span>
                  <span
                    className="font-serif text-[56px] md:text-[100px] leading-none tracking-[-0.015em] tabular-nums"
                    style={{ fontWeight: 250 }}
                  >
                    {formatNumber(monthlyData.expense)}
                  </span>
                </div>
              </div>

              {/* Right: income / balance / savings rate + trend */}
              <div className="mt-4 md:mt-0 md:border-l md:pl-10 border-panel-foreground/20">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] opacity-65">収入</span>
                  <span className="font-serif text-[19px] tabular-nums">{formatCurrency(monthlyData.income)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="text-[12px] opacity-65">収支</span>
                  <span className="font-serif text-[19px] tabular-nums">{formatCurrency(monthlyData.balance)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="text-[12px] opacity-65">貯蓄率</span>
                  <span className="font-serif text-[19px] tabular-nums">{monthlyData.savingsRate}%</span>
                </div>

                <div className="mt-[18px] border-t border-panel-foreground/20 pt-4">
                  <p className="text-[11px] tracking-[0.1em] opacity-65 mb-2">支出の推移（6ヶ月）</p>
                  <svg viewBox="0 0 240 64" preserveAspectRatio="none" width="100%" height="64">
                    {sparkline.areaPoints && (
                      <polygon points={sparkline.areaPoints} fill="oklch(0.97 0.008 95 / 0.08)" />
                    )}
                    {sparkline.linePoints && (
                      <polyline
                        points={sparkline.linePoints}
                        fill="none"
                        stroke="oklch(0.97 0.008 95 / 0.85)"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {sparkline.last && (
                      <circle cx={sparkline.last.x} cy={sparkline.last.y} r={3.5} fill="oklch(0.97 0.008 95)" />
                    )}
                  </svg>
                  <div className="flex justify-between mt-2">
                    {monthAbbrs.map((label, i) => (
                      <span key={i} className="font-serif text-[10.5px] tracking-[0.08em] opacity-55">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-11 px-0 md:px-6 pb-6">
              {/* Spending */}
              <div>
                <p className="italic font-serif text-[13px] tracking-[0.12em] text-muted-foreground mb-4">
                  Spending
                </p>
                <div className="space-y-3">
                  {monthlyData.categoryBreakdown.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-[15px]">{c.icon}</span>
                      <span className="text-[13.5px] w-[88px] truncate">{c.name}</span>
                      <div className="flex-1 h-[3px] rounded-[2px] bg-border">
                        <div
                          className={cn("h-full rounded-[2px]", !c.muted && "bg-primary")}
                          style={{
                            width: `${c.percentage}%`,
                            backgroundColor: c.muted ? "oklch(0.75 0.02 160)" : undefined,
                          }}
                        />
                      </div>
                      <span className="font-serif text-[15px] w-[84px] text-right tabular-nums">
                        {formatCurrency(c.value)}
                      </span>
                    </div>
                  ))}
                  {monthlyData.categoryBreakdown.length === 0 && (
                    <p className="text-sm text-muted-foreground">支出データがありません</p>
                  )}
                </div>
              </div>

              {/* Recent */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="italic font-serif text-[13px] tracking-[0.12em] text-muted-foreground">
                    Recent
                  </p>
                  <Link href="/transactions" className="text-[11.5px]" style={{ color: "oklch(0.55 0.01 260)" }}>
                    すべて表示 →
                  </Link>
                </div>
                <div>
                  {recentTransactions.map((t, i) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 py-3",
                        i !== recentTransactions.length - 1 && "border-b border-border"
                      )}
                    >
                      <span className="text-[15px]">{t.icon ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] truncate m-0">{t.name || t.memo || t.category}</p>
                        <p className="text-[11px] mt-0.5 m-0" style={{ color: "oklch(0.58 0.008 260)" }}>
                          {formatDate(t.date)}・{t.account}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-serif text-[15px] tabular-nums shrink-0",
                          t.type === "income" ? "text-primary" : "text-foreground"
                        )}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                  {recentTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">取引がありません</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

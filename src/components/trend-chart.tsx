"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/data"

export interface TrendDataPoint {
  month: string
  income: number
  expense: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
}

interface TooltipEntry {
  name: string
  value: number
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: TooltipEntry[]
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 shadow-md text-sm space-y-1">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: TooltipEntry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name === "income" ? "収入" : "支出"}
          </span>
          <span className="tabular-nums text-foreground ml-auto pl-4">
            {formatCurrency(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="rounded-2xl bg-card p-6 md:p-8">
      <p className="text-xs tracking-wide uppercase text-muted-foreground mb-6">
        収支推移（直近6ヶ月）
      </p>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap="30%"
            barGap={3}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-muted-foreground)", fillOpacity: 0.06 }}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--color-income)" }}
          />
          <span className="text-xs text-muted-foreground">収入</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--color-chart-1)" }}
          />
          <span className="text-xs text-muted-foreground">支出</span>
        </div>
      </div>
    </div>
  )
}

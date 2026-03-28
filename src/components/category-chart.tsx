"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/data"

interface CategoryData {
  name: string
  value: number
  fill: string
}

interface CategoryChartProps {
  data: CategoryData[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="rounded-2xl bg-card p-6 md:p-8 h-full">
      <p className="text-xs tracking-wide uppercase text-muted-foreground mb-6">
        支出内訳
      </p>

      {/* Chart */}
      <div className="h-44 w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <ul className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(0)
          return (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm tabular-nums text-foreground">
                {percentage}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

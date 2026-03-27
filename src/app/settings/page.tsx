"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { categories, accounts } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Pencil, Trash2, Tags, Wallet, CalendarClock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const fixedExpenseTemplates = [
  { id: "1", name: "家賃", amount: 95000, day: 27, category: "住居費" },
  { id: "2", name: "電気代", amount: 8500, day: 15, category: "光熱費" },
  { id: "3", name: "ガス代", amount: 4200, day: 15, category: "光熱費" },
  { id: "4", name: "水道代", amount: 3800, day: 15, category: "光熱費" },
  { id: "5", name: "スマホ", amount: 6800, day: 10, category: "通信費" },
  { id: "6", name: "インターネット", amount: 4500, day: 10, category: "通信費" },
  { id: "7", name: "積立NISA", amount: 50000, day: 5, category: "投資" },
]

type SettingsTab = "categories" | "accounts" | "templates"

const tabs = [
  { id: "categories" as const, label: "カテゴリ", icon: Tags },
  { id: "accounts" as const, label: "口座", icon: Wallet },
  { id: "templates" as const, label: "固定費", icon: CalendarClock },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories")

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            Preferences
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            設定
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 rounded-full bg-muted p-1 max-w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="max-w-2xl">
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="space-y-8">
              {/* Income Categories */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">
                    収入カテゴリ
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        + 追加
                      </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>カテゴリを追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input placeholder="カテゴリ名" className="rounded-xl" />
                        <Button className="w-full rounded-xl">追加する</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="rounded-2xl bg-card divide-y divide-border/50">
                  {incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">
                    支出カテゴリ
                  </p>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    + 追加
                  </button>
                </div>
                <div className="rounded-2xl bg-card divide-y divide-border/50">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  登録口座
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      + 追加
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>口座を追加</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input placeholder="口座名" className="rounded-xl" />
                      <Input type="number" placeholder="初期残高" className="rounded-xl" />
                      <Button className="w-full rounded-xl">追加する</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="rounded-2xl bg-card divide-y divide-border/50">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{account.icon}</span>
                      <div>
                        <p className="text-sm text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ¥{account.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  固定費テンプレート
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      + 追加
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>固定費を追加</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input placeholder="名称" className="rounded-xl" />
                      <Input type="number" placeholder="金額" className="rounded-xl" />
                      <Input type="number" placeholder="引落日 (1-31)" min="1" max="31" className="rounded-xl" />
                      <Button className="w-full rounded-xl">追加する</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                毎月自動で明細に追加される固定費
              </p>
              <div className="rounded-2xl bg-card divide-y divide-border/50">
                {fixedExpenseTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="text-sm text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        毎月{template.day}日
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm tabular-nums text-foreground">
                        ¥{template.amount.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

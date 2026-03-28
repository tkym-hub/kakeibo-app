"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { getTransactions, getCategories, getAccounts, formatCurrency, formatDate, groupTransactionsByDate, getCurrentMonth, shiftMonth } from "@/lib/data"
import { Transaction, Category, Account, TransactionType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { SlidersHorizontal, X, Pencil, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // 編集用
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editType, setEditType] = useState<TransactionType>("expense")
  const [editAmount, setEditAmount] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editAccountId, setEditAccountId] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editMemo, setEditMemo] = useState("")
  const [saving, setSaving] = useState(false)

  async function loadTransactions() {
    const txs = await getTransactions(currentMonth)
    setTransactions(txs)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransactions(currentMonth),
      getCategories(),
      getAccounts(),
    ]).then(([txs, cats, accs]) => {
      setTransactions(txs)
      setCategories(cats)
      setAccounts(accs)
    }).finally(() => setLoading(false))
  }, [currentMonth])

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setEditType(tx.type)
    setEditAmount(String(tx.amount))
    setEditCategoryId(tx.category_id)
    setEditAccountId(tx.account_id)
    setEditDate(tx.date)
    setEditMemo(tx.memo ?? "")
  }

  async function handleUpdate() {
    if (!editingTx || !editAmount || !editCategoryId || !editAccountId) return
    setSaving(true)
    const { error } = await supabase.from("transactions").update({
      type: editType,
      amount: parseInt(editAmount),
      category_id: editCategoryId,
      account_id: editAccountId,
      txn_date: editDate,
      memo: editMemo || null,
    }).eq("id", editingTx.id)
    setSaving(false)
    if (error) { alert("保存に失敗しました"); return }
    setEditingTx(null)
    loadTransactions()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) { alert("削除に失敗しました"); return }
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const filteredTransactions = useMemo(() => transactions.filter((t) => {
    if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false
    if (accountFilter !== "all" && t.account_id !== accountFilter) return false
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    return true
  }), [transactions, categoryFilter, accountFilter, typeFilter])

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  )

  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all" || typeFilter !== "all"

  const editFilteredCategories = categories.filter((c) => c.type === editType)

  const editFormattedAmount = editAmount
    ? new Intl.NumberFormat("ja-JP").format(parseInt(editAmount))
    : ""

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">History</p>
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
              <MonthSelector
                month={currentMonth}
                onPrevious={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                onNext={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
              />
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-wide uppercase text-muted-foreground">絞り込み</p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setCategoryFilter("all"); setAccountFilter("all"); setTypeFilter("all") }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />クリア
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
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="口座" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <>
            <div className="space-y-6">
              {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => (
                <div key={date}>
                  <p className="text-xs tracking-wide text-muted-foreground mb-3 px-1">
                    {formatDate(date)}
                  </p>
                  <div className="rounded-2xl bg-card divide-y divide-border/50">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between px-5 py-4 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-base">
                            {transaction.icon ?? "📦"}
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
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm tabular-nums",
                              transaction.type === "income" ? "text-income" : "text-foreground"
                            )}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 md:flex transition-opacity">
                            <button
                              onClick={() => openEdit(transaction)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {groupedTransactions.size === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">該当する明細がありません</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={(open) => { if (!open) setEditingTx(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>明細を編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Type Toggle */}
            <div className="flex rounded-full bg-muted p-1">
              {(["expense", "income"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setEditType(t); setEditCategoryId("") }}
                  className={cn(
                    "flex-1 py-2 rounded-full text-sm transition-all",
                    editType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {t === "expense" ? "支出" : "収入"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">金額</p>
              <div className="flex items-baseline gap-1">
                <span className="text-muted-foreground">¥</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editFormattedAmount}
                  onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="flex-1 text-2xl font-light bg-transparent border-none outline-none tabular-nums"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">カテゴリ</p>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {editFilteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">口座</p>
              <Select value={editAccountId} onValueChange={setEditAccountId}>
                <SelectTrigger className="rounded-xl border-0 bg-muted/50">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">日付</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="pl-9 rounded-xl bg-muted/50 border-0"
                />
              </div>
            </div>

            {/* Memo */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">メモ</p>
              <Textarea
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="メモを入力..."
                className="min-h-16 rounded-xl bg-muted/50 border-0 resize-none"
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={saving || !editAmount || !editCategoryId || !editAccountId}
              className="w-full rounded-xl"
            >
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

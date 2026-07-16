"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { getTransactions, getCategories, getAccounts, formatCurrency, formatDate, groupTransactionsByDate, getCurrentMonth, shiftMonth } from "@/lib/data"
import { Transaction, Category, Account, TransactionType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { SlidersHorizontal, X, Pencil, Trash2, Calendar, ArrowUpDown, MoreHorizontal } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


export default function TransactionsPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
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
  const [editName, setEditName] = useState("")
  const [editMemo, setEditMemo] = useState("")
  const [saving, setSaving] = useState(false)

  // 削除確認用
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)

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
    setEditName(tx.name ?? "")
    setEditMemo(tx.memo ?? "")
  }

  async function handleUpdate() {
    if (!editingTx || !editAmount) return
    const isTransfer = !!editingTx.transfer_pair_id
    if (!isTransfer && (!editCategoryId || !editAccountId)) return
    setSaving(true)

    let error
    if (isTransfer) {
      // ペア両方に金額・日付・品目名・メモのみ反映（type, category_id, account_id は変更しない）
      const { error: pairError } = await supabase.from("transactions").update({
        amount: parseInt(editAmount),
        txn_date: editDate,
        name: editName || null,
        memo: editMemo || null,
      }).eq("transfer_pair_id", editingTx.transfer_pair_id)
      error = pairError
    } else {
      const { error: singleError } = await supabase.from("transactions").update({
        type: editType,
        amount: parseInt(editAmount),
        category_id: editCategoryId,
        account_id: editAccountId,
        txn_date: editDate,
        name: editName || null,
        memo: editMemo || null,
      }).eq("id", editingTx.id)
      error = singleError
    }
    setSaving(false)
    if (error) { alert("保存に失敗しました"); return }
    setEditingTx(null)
    loadTransactions()
  }

  async function handleDelete(id: string) {
    const target = transactions.find((t) => t.id === id)
    const pairId = target?.transfer_pair_id

    let error
    if (pairId) {
      // 振替ペアを両方削除
      const { error: pairError } = await supabase.from("transactions").delete().eq("transfer_pair_id", pairId)
      error = pairError
    } else {
      const { error: singleError } = await supabase.from("transactions").delete().eq("id", id)
      error = singleError
    }
    if (error) { alert("削除に失敗しました"); return }
    setDeletingTxId(null)
    setTransactions((prev) =>
      pairId ? prev.filter((t) => t.transfer_pair_id !== pairId) : prev.filter((t) => t.id !== id)
    )
  }

  const filteredTransactions = useMemo(() => transactions.filter((t) => {
    if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false
    if (accountFilter !== "all" && t.account_id !== accountFilter) return false
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    return true
  }), [transactions, categoryFilter, accountFilter, typeFilter])

  const groupedTransactions = useMemo(() => {
    const grouped = groupTransactionsByDate(filteredTransactions)
    if (sortOrder === "asc") {
      return new Map([...grouped.entries()].reverse())
    }
    return grouped
  }, [filteredTransactions, sortOrder])

  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all" || typeFilter !== "all"

  const editFilteredCategories = categories.filter((c) => c.type === editType)

  const editFormattedAmount = editAmount
    ? new Intl.NumberFormat("ja-JP").format(parseInt(editAmount))
    : ""

  const summaryCount = filteredTransactions.length
  const summaryExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  const summaryIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  function formatDateGroup(dateString: string): { md: string; dow: string } {
    const date = new Date(dateString + "T00:00:00")
    const md = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(date)
    const dow = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date).toUpperCase()
    return { md, dow }
  }

  return (
    <AppLayout>
      <div className="max-w-[880px] mx-auto px-5 pt-8 pb-16 md:px-10 md:pt-12 md:pb-[72px]">
        {/* Header */}
        <header className="mb-3">
          <p className="italic font-serif text-[13px] tracking-[0.12em] text-muted-foreground mb-3">
            History
          </p>
          <div className="flex items-end justify-between gap-4">
            <MonthSelector
              month={currentMonth}
              onPrevious={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
              onNext={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
              size="lg"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 rounded-full border border-border-mid px-3.5 py-[7px] text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="並び替え"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span className="hidden md:inline">{sortOrder === "desc" ? "新しい順" : "古い順"}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-xs transition-colors",
                  showFilters || hasActiveFilters
                    ? "border-foreground text-foreground"
                    : "border-border-mid text-muted-foreground hover:text-foreground"
                )}
                aria-label="絞り込み"
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span className="hidden md:inline">絞り込み</span>
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 mt-4 border border-border rounded-md p-5">
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
              <div className="space-y-1.5">
                <p className="text-[10px] tracking-wide uppercase text-muted-foreground px-1">種類</p>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="rounded-md border-border bg-transparent">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="income">収入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] tracking-wide uppercase text-muted-foreground px-1">カテゴリ</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="rounded-md border-border bg-transparent">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] tracking-wide uppercase text-muted-foreground px-1">口座</p>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="rounded-md border-border bg-transparent">
                    <SelectValue placeholder="すべて" />
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
          </div>
        )}

        {/* Summary row */}
        <p className="text-xs text-muted-foreground mt-4 mb-9">
          {summaryCount}件 ・ 支出 <span className="font-serif text-[13px]">{formatCurrency(summaryExpense)}</span> ・ 収入 <span className="font-serif text-[13px]">{formatCurrency(summaryIncome)}</span>
        </p>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <>
            <div className="flex flex-col gap-9">
              {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => {
                const { md, dow } = formatDateGroup(date)
                return (
                  <div key={date}>
                    <p className="font-serif text-[13px] tracking-[0.1em] text-muted-foreground border-b border-border-strong pb-2 mb-1">
                      {md} <span className="text-[11px]">{dow}</span>
                    </p>
                    <div>
                      {dayTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center gap-3.5 py-[15px] border-b border-border"
                        >
                          <div className="text-base leading-none">
                            {transaction.icon ?? "📦"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {transaction.name || transaction.category}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {transaction.name && `${transaction.category} ・ `}
                              {transaction.account}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "font-serif text-base tabular-nums whitespace-nowrap",
                              transaction.type === "income" ? "text-income" : "text-foreground"
                            )}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="ml-2 text-muted-foreground/70 tracking-[2px] hover:text-foreground transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(transaction)}>
                                <Pencil className="h-3.5 w-3.5" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onClick={() => setDeletingTxId(transaction.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {groupedTransactions.size === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">該当する明細がありません</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingTxId} onOpenChange={(open) => { if (!open) setDeletingTxId(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>明細を削除</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              {transactions.find((t) => t.id === deletingTxId)?.transfer_pair_id
                ? "振替の両方の明細が削除されます。元に戻せません。"
                : "この明細を削除します。元に戻せません。"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeletingTxId(null)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={() => deletingTxId && handleDelete(deletingTxId)}
              >
                削除する
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={(open) => { if (!open) setEditingTx(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>明細を編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Type Toggle - 振替明細は種類変更不可 */}
            {!editingTx?.transfer_pair_id && (
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
            )}

            {/* Name */}
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-2">品目名</p>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例：ランチ、スーパー"
                className="rounded-xl bg-muted/50 border-0"
              />
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

            {/* Category - 振替明細は非表示 */}
            {!editingTx?.transfer_pair_id && (
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
            )}

            {/* Account - 振替明細は非表示 */}
            {!editingTx?.transfer_pair_id && (
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
            )}

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
              disabled={saving || !editAmount || (!editingTx?.transfer_pair_id && (!editCategoryId || !editAccountId))}
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

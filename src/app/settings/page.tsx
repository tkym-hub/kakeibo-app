"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { getCategories, getAccounts, getTemplates, DEFAULT_CATEGORIES } from "@/lib/data"
import { Category, Account, RecurringTemplate, TransactionType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { formatCurrency, getCurrentMonth } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SettingsTab = "categories" | "accounts" | "templates"

function isValidDayOfMonth(value: string): boolean {
  if (!value.trim()) return false
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 31
}

const tabs = [
  { id: "categories" as const, label: "カテゴリ" },
  { id: "accounts" as const, label: "口座" },
  { id: "templates" as const, label: "固定費" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories")
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // カテゴリ追加
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense")
  const [newCategoryIsFixed, setNewCategoryIsFixed] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)

  // カテゴリ編集
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryIcon, setEditCategoryIcon] = useState("")
  const [editCategoryIsFixed, setEditCategoryIsFixed] = useState(false)

  // 口座追加
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountIcon, setNewAccountIcon] = useState("")
  const [newAccountKind, setNewAccountKind] = useState<"bank" | "cash" | "credit_card" | "e_money">("bank")
  const [newAccountBalance, setNewAccountBalance] = useState("")
  const [newAccountDebitId, setNewAccountDebitId] = useState("")
  const [addAccountOpen, setAddAccountOpen] = useState(false)

  // 口座編集
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editAccountName, setEditAccountName] = useState("")
  const [editAccountIcon, setEditAccountIcon] = useState("")
  const [editAccountBalance, setEditAccountBalance] = useState("")
  const [editAccountDebitId, setEditAccountDebitId] = useState("")

  // テンプレート編集
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)
  const [editTplName, setEditTplName] = useState("")
  const [editTplAmount, setEditTplAmount] = useState("")
  const [editTplType, setEditTplType] = useState<TransactionType>("expense")
  const [editTplCategoryId, setEditTplCategoryId] = useState("")
  const [editTplAccountId, setEditTplAccountId] = useState("")
  const [editTplDay, setEditTplDay] = useState("")

  // テンプレート追加
  const [newTplName, setNewTplName] = useState("")
  const [newTplAmount, setNewTplAmount] = useState("")
  const [newTplType, setNewTplType] = useState<TransactionType>("expense")
  const [newTplCategoryId, setNewTplCategoryId] = useState("")
  const [newTplAccountId, setNewTplAccountId] = useState("")
  const [newTplDay, setNewTplDay] = useState("")
  const [addTplOpen, setAddTplOpen] = useState(false)
  const [applyingTemplates, setApplyingTemplates] = useState(false)

  // 削除確認用
  const [deletingItem, setDeletingItem] = useState<{ kind: "category" | "account" | "template"; id: string; name: string } | null>(null)

  async function loadData() {
    setLoading(true)
    const [cats, accs, tpls] = await Promise.all([getCategories(), getAccounts(), getTemplates()])
    setCategories(cats)
    setAccounts(accs)
    setTemplates(tpls)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // デフォルトカテゴリシード
  async function seedDefaultCategories() {
    const user = await getUser()
    if (!user) return
    await supabase.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id, is_active: true }))
    )
    loadData()
  }

  // カテゴリ追加
  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    const user = await getUser()
    if (!user) return
    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: newCategoryName.trim(),
      icon: newCategoryIcon.trim() || null,
      type: newCategoryType,
      sort_order: 99,
      is_fixed: newCategoryType === "expense" ? newCategoryIsFixed : false,
      is_active: true,
    })
    if (error) { alert("追加に失敗しました"); return }
    setNewCategoryName("")
    setNewCategoryIcon("")
    setNewCategoryIsFixed(false)
    setAddCategoryOpen(false)
    loadData()
  }

  // カテゴリ名変更
  async function handleRenameCategory() {
    if (!editingCategory || !editCategoryName.trim()) return
    const { error } = await supabase.from("categories").update({
      name: editCategoryName.trim(),
      icon: editCategoryIcon.trim() || null,
      is_fixed: editingCategory.type === "expense" ? editCategoryIsFixed : false,
    }).eq("id", editingCategory.id)
    if (error) { alert("変更に失敗しました"); return }
    setEditingCategory(null)
    loadData()
  }

  // カテゴリ削除
  async function handleDeleteCategory(id: string) {
    const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", id)
    if (error) { alert("削除に失敗しました"); return }
    loadData()
  }

  // 口座追加
  async function handleAddAccount() {
    if (!newAccountName.trim()) return
    const openingBalance = parseInt(newAccountBalance) || 0
    if (openingBalance < 0) { alert("初期残高は0以上で入力してください"); return }
    const user = await getUser()
    if (!user) return
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: newAccountName.trim(),
      icon: newAccountIcon.trim() || null,
      kind: newAccountKind,
      opening_balance: openingBalance,
      sort_order: 99,
      is_active: true,
      debit_account_id: newAccountKind === "credit_card" && newAccountDebitId ? newAccountDebitId : null,
    })
    if (error) { alert("追加に失敗しました"); return }
    setNewAccountName("")
    setNewAccountIcon("")
    setNewAccountBalance("")
    setNewAccountDebitId("")
    setAddAccountOpen(false)
    loadData()
  }

  // 口座名変更
  async function handleRenameAccount() {
    if (!editingAccount || !editAccountName.trim()) return
    const editOpeningBalance = parseInt(editAccountBalance) || 0
    if (editOpeningBalance < 0) { alert("初期残高は0以上で入力してください"); return }
    const { error } = await supabase.from("accounts").update({
      name: editAccountName.trim(),
      icon: editAccountIcon.trim() || null,
      opening_balance: editOpeningBalance,
      debit_account_id: editingAccount.kind === "credit_card" && editAccountDebitId ? editAccountDebitId : null,
    }).eq("id", editingAccount.id)
    if (error) { alert("変更に失敗しました"); return }
    setEditingAccount(null)
    loadData()
  }

  // 口座削除
  async function handleDeleteAccount(id: string) {
    const { error } = await supabase.from("accounts").update({ is_active: false }).eq("id", id)
    if (error) { alert("削除に失敗しました"); return }
    loadData()
  }

  // テンプレート追加
  async function handleAddTemplate() {
    if (!newTplName.trim() || !newTplAmount || !newTplCategoryId || !newTplAccountId || !isValidDayOfMonth(newTplDay)) return
    const user = await getUser()
    if (!user) return
    const { error } = await supabase.from("recurring_templates").insert({
      user_id: user.id,
      name: newTplName.trim(),
      amount: parseInt(newTplAmount),
      type: newTplType,
      category_id: newTplCategoryId,
      account_id: newTplAccountId,
      day_of_month: parseInt(newTplDay),
      is_active: true,
    })
    if (error) { alert("追加に失敗しました"); return }
    setNewTplName(""); setNewTplAmount(""); setNewTplCategoryId(""); setNewTplAccountId(""); setNewTplDay("")
    setAddTplOpen(false)
    loadData()
  }

  async function handleUpdateTemplate() {
    const amount = parseInt(editTplAmount)
    const day = parseInt(editTplDay)
    if (!editingTemplate || !editTplName.trim() || isNaN(amount) || !editTplCategoryId || !editTplAccountId || !isValidDayOfMonth(editTplDay)) return
    const { error } = await supabase.from("recurring_templates").update({
      name: editTplName.trim(),
      amount,
      type: editTplType,
      category_id: editTplCategoryId,
      account_id: editTplAccountId,
      day_of_month: day,
    }).eq("id", editingTemplate.id)
    if (error) { alert("更新に失敗しました"); return }
    setEditingTemplate(null)
    loadData()
  }

  // テンプレート削除
  async function handleDeleteTemplate(id: string) {
    const { error } = await supabase.from("recurring_templates").update({ is_active: false }).eq("id", id)
    if (error) { alert("削除に失敗しました"); return }
    loadData()
  }

  // 削除確認ダイアログからの実行
  async function handleConfirmDelete() {
    if (!deletingItem) return
    const { kind, id } = deletingItem
    let error = null
    if (kind === "category") {
      const result = await supabase.from("categories").update({ is_active: false }).eq("id", id)
      error = result.error
    } else if (kind === "account") {
      const result = await supabase.from("accounts").update({ is_active: false }).eq("id", id)
      error = result.error
    } else {
      const result = await supabase.from("recurring_templates").update({ is_active: false }).eq("id", id)
      error = result.error
    }
    if (error) { alert("削除に失敗しました"); return }
    setDeletingItem(null)
    loadData()
  }

  // 今月分を一括登録
  async function handleApplyTemplates() {
    if (templates.length === 0) return
    setApplyingTemplates(true)
    const user = await getUser()
    if (!user) { setApplyingTemplates(false); return }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const lastDay = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

    // 今月すでに登録済みのテンプレート名（memo）を取得して重複防止
    const { data: existing } = await supabase
      .from("transactions")
      .select("memo")
      .eq("user_id", user.id)
      .gte("txn_date", monthStart)
      .lte("txn_date", monthEnd)
    const existingMemos = new Set((existing ?? []).map((r) => r.memo))

    const rows = templates
      .filter((tpl) => !existingMemos.has(tpl.name))
      .map((tpl) => {
        const day = Math.min(tpl.day_of_month, lastDay)
        const txn_date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        return {
          user_id: user.id,
          type: tpl.type,
          amount: tpl.amount,
          category_id: tpl.category_id,
          account_id: tpl.account_id,
          txn_date,
          memo: tpl.name,
        }
      })

    if (rows.length === 0) {
      setApplyingTemplates(false)
      alert(`${getCurrentMonth()}分はすでに登録済みです`)
      return
    }

    const { error } = await supabase.from("transactions").insert(rows)
    setApplyingTemplates(false)
    if (error) { alert("登録に失敗しました"); return }
    alert(`${getCurrentMonth()}分の固定費を${rows.length}件登録しました`)
  }

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")
  const tplFilteredCategories = categories.filter((c) => c.type === newTplType)

  // 見出し行（ラベル + 濃罫線下線 + 右に任意のアクション要素）
  function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
    return (
      <div className="flex items-baseline justify-between border-b border-border-strong pb-2.5">
        <p className="text-xs tracking-[0.1em] text-muted-foreground">{label}</p>
        {action}
      </div>
    )
  }

  // 「＋ 追加」テキストリンク（Dialogトリガーの見た目）
  function AddLink({ children }: { children: React.ReactNode }) {
    return (
      <span className="text-xs text-primary-deep hover:opacity-80 transition-opacity cursor-pointer">
        {children}
      </span>
    )
  }

  // リスト行（アイコン/名称/バッジ/サブテキスト/金額/編集・削除リンク）薄罫線区切り
  function ListRow({
    icon,
    title,
    badge,
    subtitle,
    amount,
    onEdit,
    onDelete,
  }: {
    icon: string
    title: string
    badge?: string
    subtitle?: string
    amount?: string
    onEdit: () => void
    onDelete: () => void
  }) {
    return (
      <div className="flex items-center gap-3 py-[15px] border-b border-border">
        <span className="text-[15px]">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-[13.5px] text-foreground">{title}</span>
          {badge && (
            <span className="ml-2 text-[10.5px] text-muted-foreground border border-border-mid rounded-[4px] px-[7px] py-[2px] align-middle">
              {badge}
            </span>
          )}
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {amount && (
          <span className="font-serif text-[15px] text-foreground tabular-nums whitespace-nowrap">{amount}</span>
        )}
        <button
          onClick={onEdit}
          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          編集
        </button>
        <button
          onClick={onDelete}
          className="ml-4 text-[11.5px] text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
        >
          削除
        </button>
      </div>
    )
  }

  function CategoryList({ cats }: { cats: Category[] }) {
    return (
      <div>
        {cats.map((category) => (
          <ListRow
            key={category.id}
            icon={category.icon}
            title={category.name}
            badge={category.is_fixed ? "固定費" : undefined}
            onEdit={() => { setEditingCategory(category); setEditCategoryName(category.name); setEditCategoryIcon(category.icon); setEditCategoryIsFixed(category.is_fixed) }}
            onDelete={() => setDeletingItem({ kind: "category", id: category.id, name: category.name })}
          />
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-[760px] mx-auto px-6 md:px-10 pt-10 pb-16 md:pt-12 md:pb-[88px]">
        <header className="mb-9">
          <p className="italic font-serif text-[13px] tracking-[0.14em] text-muted-foreground mb-2.5">
            Preferences
          </p>
          <h1 className="font-serif text-[28px] md:text-[34px] text-foreground">Settings</h1>
        </header>

        <div className="flex gap-9 border-b border-border text-sm mb-11">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "-mb-px pb-3 border-b-[1.5px] transition-colors",
                activeTab === tab.id
                  ? "font-medium text-foreground border-primary"
                  : "text-muted-foreground border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <div>

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="space-y-11">
                {categories.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground mb-4">カテゴリがありません</p>
                    <Button variant="outline" onClick={seedDefaultCategories}>
                      デフォルトカテゴリを追加
                    </Button>
                  </div>
                )}

                {/* 収入カテゴリ */}
                <div>
                  <SectionHeader
                    label="収入カテゴリ"
                    action={
                      <Dialog open={addCategoryOpen && newCategoryType === "income"} onOpenChange={(o) => { setAddCategoryOpen(o); setNewCategoryType("income") }}>
                        <DialogTrigger asChild>
                          <button onClick={() => setNewCategoryType("income")}>
                            <AddLink>＋ 追加</AddLink>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader><DialogTitle>収入カテゴリを追加</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="flex gap-2">
                              <Input placeholder="絵文字" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="rounded-xl w-20 text-center text-lg" maxLength={8} />
                              <Input placeholder="カテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-xl flex-1" />
                            </div>
                            <p className="text-xs text-muted-foreground">絵文字は省略可（自動で割り当てます）</p>
                            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="w-full rounded-xl">追加する</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    }
                  />
                  {incomeCategories.length > 0 && <CategoryList cats={incomeCategories} />}
                </div>

                {/* 支出カテゴリ */}
                <div>
                  <SectionHeader
                    label="支出カテゴリ"
                    action={
                      <Dialog open={addCategoryOpen && newCategoryType === "expense"} onOpenChange={(o) => { setAddCategoryOpen(o); setNewCategoryType("expense") }}>
                        <DialogTrigger asChild>
                          <button onClick={() => setNewCategoryType("expense")}>
                            <AddLink>＋ 追加</AddLink>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader><DialogTitle>支出カテゴリを追加</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="flex gap-2">
                              <Input placeholder="絵文字" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="rounded-xl w-20 text-center text-lg" maxLength={8} />
                              <Input placeholder="カテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-xl flex-1" />
                            </div>
                            <p className="text-xs text-muted-foreground">絵文字は省略可（自動で割り当てます）</p>
                            <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                              <span className="text-sm text-foreground">固定費として扱う</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={newCategoryIsFixed}
                                onClick={() => setNewCategoryIsFixed(!newCategoryIsFixed)}
                                className={cn(
                                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                                  newCategoryIsFixed ? "bg-foreground" : "bg-muted"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                                    newCategoryIsFixed ? "translate-x-4" : "translate-x-0.5"
                                  )}
                                />
                              </button>
                            </div>
                            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="w-full rounded-xl">追加する</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    }
                  />
                  {expenseCategories.length > 0 && <CategoryList cats={expenseCategories} />}
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div>
                <SectionHeader
                  label="登録口座"
                  action={
                    <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
                      <DialogTrigger asChild>
                        <button><AddLink>＋ 追加</AddLink></button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>口座を追加</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="flex gap-2">
                            <Input placeholder="絵文字" value={newAccountIcon} onChange={(e) => setNewAccountIcon(e.target.value)} className="rounded-xl w-20 text-center text-lg" maxLength={8} />
                            <Input placeholder="口座名" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="rounded-xl flex-1" />
                          </div>
                          <p className="text-xs text-muted-foreground">絵文字は省略可（自動で割り当てます）</p>
                          <Select value={newAccountKind} onValueChange={(v) => { setNewAccountKind(v as typeof newAccountKind); setNewAccountDebitId("") }}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="種類" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">銀行口座</SelectItem>
                              <SelectItem value="cash">現金</SelectItem>
                              <SelectItem value="credit_card">クレジットカード</SelectItem>
                              <SelectItem value="e_money">電子マネー</SelectItem>
                            </SelectContent>
                          </Select>
                          {newAccountKind === "credit_card" && (
                            <Select value={newAccountDebitId} onValueChange={setNewAccountDebitId}>
                              <SelectTrigger className="rounded-xl"><SelectValue placeholder="引き落とし元口座（任意）" /></SelectTrigger>
                              <SelectContent>
                                {accounts.filter((a) => a.kind === "bank").map((a) => (
                                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Input type="number" placeholder="初期残高（任意）" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} className="rounded-xl" />
                          <Button onClick={handleAddAccount} className="w-full rounded-xl">追加する</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  }
                />

                {accounts.length === 0 ? (
                  <p className="pt-6 text-sm text-muted-foreground">口座が登録されていません</p>
                ) : (
                  <div>
                    {accounts.map((account) => (
                      <ListRow
                        key={account.id}
                        icon={account.icon ?? "🏦"}
                        title={account.name}
                        subtitle={`¥${account.balance.toLocaleString()}`}
                        onEdit={() => { setEditingAccount(account); setEditAccountName(account.name); setEditAccountIcon(account.icon ?? ""); setEditAccountBalance(String(account.opening_balance ?? 0)); setEditAccountDebitId(account.debit_account_id ?? "") }}
                        onDelete={() => setDeletingItem({ kind: "account", id: account.id, name: account.name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div>
                <SectionHeader
                  label="固定費テンプレート"
                  action={
                    <Dialog open={addTplOpen} onOpenChange={setAddTplOpen}>
                      <DialogTrigger asChild>
                        <button><AddLink>＋ 追加</AddLink></button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl max-w-sm">
                        <DialogHeader><DialogTitle>固定費を追加</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input placeholder="名称（例：家賃）" value={newTplName} onChange={(e) => setNewTplName(e.target.value)} className="rounded-xl" />
                          <Input type="number" placeholder="金額" value={newTplAmount} onChange={(e) => setNewTplAmount(e.target.value)} className="rounded-xl" />
                          <div className="flex rounded-full bg-muted p-1">
                            {(["expense", "income"] as TransactionType[]).map((t) => (
                              <button key={t} onClick={() => { setNewTplType(t); setNewTplCategoryId("") }}
                                className={cn("flex-1 py-1.5 rounded-full text-sm transition-all", newTplType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                              >
                                {t === "expense" ? "支出" : "収入"}
                              </button>
                            ))}
                          </div>
                          <Select value={newTplCategoryId} onValueChange={setNewTplCategoryId}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="カテゴリ" /></SelectTrigger>
                            <SelectContent>
                              {tplFilteredCategories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={newTplAccountId} onValueChange={setNewTplAccountId}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="口座" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="引落日（1〜31）" min="1" max="31" value={newTplDay} onChange={(e) => setNewTplDay(e.target.value)} className="rounded-xl" />
                          {newTplDay && !isValidDayOfMonth(newTplDay) && (
                            <p className="text-xs text-destructive">引落日は1〜31の範囲で入力してください</p>
                          )}
                          <Button onClick={handleAddTemplate} disabled={!newTplName || !newTplAmount || !newTplCategoryId || !newTplAccountId || !isValidDayOfMonth(newTplDay)} className="w-full rounded-xl">
                            追加する
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  }
                />

                <p className="text-xs text-muted-foreground pt-3 pb-1">毎月の固定費を登録して一括登録できます</p>

                {templates.length === 0 ? (
                  <p className="pt-6 text-sm text-muted-foreground">テンプレートがありません</p>
                ) : (
                  <>
                    <div>
                      {templates.map((tpl) => (
                        <ListRow
                          key={tpl.id}
                          icon={tpl.icon ?? "📅"}
                          title={tpl.name}
                          subtitle={`${tpl.category} ・ ${tpl.account} ・ 毎月${tpl.day_of_month}日`}
                          amount={formatCurrency(tpl.amount)}
                          onEdit={() => {
                            setEditingTemplate(tpl)
                            setEditTplName(tpl.name)
                            setEditTplAmount(String(tpl.amount))
                            setEditTplType(tpl.type)
                            setEditTplCategoryId(tpl.category_id)
                            setEditTplAccountId(tpl.account_id)
                            setEditTplDay(String(tpl.day_of_month))
                          }}
                          onDelete={() => setDeletingItem({ kind: "template", id: tpl.id, name: tpl.name })}
                        />
                      ))}
                    </div>

                    <Button
                      onClick={handleApplyTemplates}
                      disabled={applyingTemplates}
                      variant="outline"
                      className="w-full mt-6"
                    >
                      {applyingTemplates ? "登録中..." : `${getCurrentMonth()}分を一括登録`}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* カテゴリ名変更 Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(o) => { if (!o) setEditingCategory(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>カテゴリを編集</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input placeholder="絵文字" value={editCategoryIcon} onChange={(e) => setEditCategoryIcon(e.target.value)} className="rounded-xl w-20 text-center text-lg" maxLength={8} />
              <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="rounded-xl flex-1" />
            </div>
            {editingCategory?.type === "expense" && (
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                <span className="text-sm text-foreground">固定費として扱う</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editCategoryIsFixed}
                  onClick={() => setEditCategoryIsFixed(!editCategoryIsFixed)}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                    editCategoryIsFixed ? "bg-foreground" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                      editCategoryIsFixed ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            )}
            <Button onClick={handleRenameCategory} disabled={!editCategoryName.trim()} className="w-full rounded-xl">保存する</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 口座編集 Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(o) => { if (!o) setEditingAccount(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>口座を編集</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input placeholder="絵文字" value={editAccountIcon} onChange={(e) => setEditAccountIcon(e.target.value)} className="rounded-xl w-20 text-center text-lg" maxLength={8} />
              <Input value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} className="rounded-xl flex-1" placeholder="口座名" />
            </div>
            {editingAccount?.kind === "credit_card" && (
              <Select value={editAccountDebitId} onValueChange={setEditAccountDebitId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="引き落とし元口座（任意）" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.kind === "bank").map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input type="number" value={editAccountBalance} onChange={(e) => setEditAccountBalance(e.target.value)} className="rounded-xl" placeholder="初期残高" />
            <p className="text-xs text-muted-foreground">初期残高を変更すると現在の残高も変わります</p>
            <Button onClick={handleRenameAccount} disabled={!editAccountName.trim()} className="w-full rounded-xl">保存する</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認 Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={(o) => { if (!o) setDeletingItem(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deletingItem?.kind === "category" ? "カテゴリを削除" : deletingItem?.kind === "account" ? "口座を削除" : "固定費を削除"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">「{deletingItem?.name}」を削除します。元に戻せません。</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeletingItem(null)}>
                キャンセル
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleConfirmDelete}>
                削除する
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* テンプレート編集 Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(o) => { if (!o) setEditingTemplate(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>固定費を編集</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="名称" value={editTplName} onChange={(e) => setEditTplName(e.target.value)} className="rounded-xl" />
            <Input type="number" placeholder="金額" value={editTplAmount} onChange={(e) => setEditTplAmount(e.target.value)} className="rounded-xl" />
            <div className="flex rounded-full bg-muted p-1">
              {(["expense", "income"] as TransactionType[]).map((t) => (
                <button key={t} onClick={() => { setEditTplType(t); setEditTplCategoryId(editingTemplate && t === editingTemplate.type ? editingTemplate.category_id : "") }}
                  className={cn("flex-1 py-1.5 rounded-full text-sm transition-all", editTplType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  {t === "expense" ? "支出" : "収入"}
                </button>
              ))}
            </div>
            <Select value={editTplCategoryId} onValueChange={setEditTplCategoryId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="カテゴリ" /></SelectTrigger>
              <SelectContent>
                {categories.filter((c) => c.type === editTplType).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={editTplAccountId} onValueChange={setEditTplAccountId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="口座" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="引落日（1〜31）" min="1" max="31" value={editTplDay} onChange={(e) => setEditTplDay(e.target.value)} className="rounded-xl" />
            {editTplDay && !isValidDayOfMonth(editTplDay) && (
              <p className="text-xs text-destructive">引落日は1〜31の範囲で入力してください</p>
            )}
            <Button onClick={handleUpdateTemplate} disabled={!editTplName.trim() || !editTplAmount || !editTplCategoryId || !editTplAccountId || !isValidDayOfMonth(editTplDay)} className="w-full rounded-xl">保存する</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

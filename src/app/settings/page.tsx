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
import { Pencil, Trash2, Tags, Wallet, CalendarClock } from "lucide-react"
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

const tabs = [
  { id: "categories" as const, label: "カテゴリ", icon: Tags },
  { id: "accounts" as const, label: "口座", icon: Wallet },
  { id: "templates" as const, label: "固定費", icon: CalendarClock },
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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)

  // カテゴリ編集
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryIcon, setEditCategoryIcon] = useState("")

  // 口座追加
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountKind, setNewAccountKind] = useState<"bank" | "cash" | "credit_card" | "e_money">("bank")
  const [newAccountBalance, setNewAccountBalance] = useState("")
  const [addAccountOpen, setAddAccountOpen] = useState(false)

  // 口座編集
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editAccountName, setEditAccountName] = useState("")

  // テンプレート追加
  const [newTplName, setNewTplName] = useState("")
  const [newTplAmount, setNewTplAmount] = useState("")
  const [newTplType, setNewTplType] = useState<TransactionType>("expense")
  const [newTplCategoryId, setNewTplCategoryId] = useState("")
  const [newTplAccountId, setNewTplAccountId] = useState("")
  const [newTplDay, setNewTplDay] = useState("")
  const [addTplOpen, setAddTplOpen] = useState(false)
  const [applyingTemplates, setApplyingTemplates] = useState(false)

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
      is_fixed: false,
      is_active: true,
    })
    if (error) { alert("追加に失敗しました"); return }
    setNewCategoryName("")
    setNewCategoryIcon("")
    setAddCategoryOpen(false)
    loadData()
  }

  // カテゴリ名変更
  async function handleRenameCategory() {
    if (!editingCategory || !editCategoryName.trim()) return
    const { error } = await supabase.from("categories").update({
      name: editCategoryName.trim(),
      icon: editCategoryIcon.trim() || null,
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
    const user = await getUser()
    if (!user) return
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: newAccountName.trim(),
      kind: newAccountKind,
      opening_balance: parseInt(newAccountBalance) || 0,
      sort_order: 99,
      is_active: true,
    })
    if (error) { alert("追加に失敗しました"); return }
    setNewAccountName("")
    setNewAccountBalance("")
    setAddAccountOpen(false)
    loadData()
  }

  // 口座名変更
  async function handleRenameAccount() {
    if (!editingAccount || !editAccountName.trim()) return
    const { error } = await supabase.from("accounts").update({ name: editAccountName.trim() }).eq("id", editingAccount.id)
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
    if (!newTplName.trim() || !newTplAmount || !newTplCategoryId || !newTplAccountId || !newTplDay) return
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

  // テンプレート削除
  async function handleDeleteTemplate(id: string) {
    const { error } = await supabase.from("recurring_templates").update({ is_active: false }).eq("id", id)
    if (error) { alert("削除に失敗しました"); return }
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

  function CategoryList({ cats }: { cats: Category[] }) {
    return (
      <div className="rounded-2xl bg-card divide-y divide-border/50">
        {cats.map((category) => (
          <div key={category.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm text-foreground">{category.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditingCategory(category); setEditCategoryName(category.name); setEditCategoryIcon(category.icon) }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Preferences</p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">設定</h1>
        </header>

        <div className="flex gap-1 mb-8 rounded-full bg-muted p-1 max-w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all",
                  activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <div className="max-w-2xl">

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="space-y-8">
                {categories.length === 0 && (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-4">カテゴリがありません</p>
                    <Button variant="outline" onClick={seedDefaultCategories} className="rounded-xl">
                      デフォルトカテゴリを追加
                    </Button>
                  </div>
                )}

                {/* 収入カテゴリ */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs tracking-wide uppercase text-muted-foreground">収入カテゴリ</p>
                    <Dialog open={addCategoryOpen && newCategoryType === "income"} onOpenChange={(o) => { setAddCategoryOpen(o); setNewCategoryType("income") }}>
                      <DialogTrigger asChild>
                        <button onClick={() => setNewCategoryType("income")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 追加</button>
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
                  </div>
                  {incomeCategories.length > 0 && <CategoryList cats={incomeCategories} />}
                </div>

                {/* 支出カテゴリ */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs tracking-wide uppercase text-muted-foreground">支出カテゴリ</p>
                    <Dialog open={addCategoryOpen && newCategoryType === "expense"} onOpenChange={(o) => { setAddCategoryOpen(o); setNewCategoryType("expense") }}>
                      <DialogTrigger asChild>
                        <button onClick={() => setNewCategoryType("expense")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 追加</button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>支出カテゴリを追加</DialogTitle></DialogHeader>
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
                  </div>
                  {expenseCategories.length > 0 && <CategoryList cats={expenseCategories} />}
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">登録口座</p>
                  <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 追加</button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader><DialogTitle>口座を追加</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input placeholder="口座名" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="rounded-xl" />
                        <Select value={newAccountKind} onValueChange={(v) => setNewAccountKind(v as typeof newAccountKind)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="種類" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank">銀行口座</SelectItem>
                            <SelectItem value="cash">現金</SelectItem>
                            <SelectItem value="credit_card">クレジットカード</SelectItem>
                            <SelectItem value="e_money">電子マネー</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder="初期残高（任意）" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} className="rounded-xl" />
                        <Button onClick={handleAddAccount} className="w-full rounded-xl">追加する</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">口座が登録されていません</p>
                ) : (
                  <div className="rounded-2xl bg-card divide-y divide-border/50">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{account.icon}</span>
                          <div>
                            <p className="text-sm text-foreground">{account.name}</p>
                            <p className="text-xs text-muted-foreground">¥{account.balance.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingAccount(account); setEditAccountName(account.name) }}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">固定費テンプレート</p>
                  <Dialog open={addTplOpen} onOpenChange={setAddTplOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 追加</button>
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
                        <Button onClick={handleAddTemplate} disabled={!newTplName || !newTplAmount || !newTplCategoryId || !newTplAccountId || !newTplDay} className="w-full rounded-xl">
                          追加する
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <p className="text-xs text-muted-foreground mb-4">毎月の固定費を登録して一括登録できます</p>

                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">テンプレートがありません</p>
                ) : (
                  <>
                    <div className="rounded-2xl bg-card divide-y divide-border/50 mb-4">
                      {templates.map((tpl) => (
                        <div key={tpl.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <p className="text-sm text-foreground">{tpl.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl.icon} {tpl.category} · {tpl.account} · 毎月{tpl.day_of_month}日
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm tabular-nums text-foreground">
                              {formatCurrency(tpl.amount)}
                            </span>
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleApplyTemplates}
                      disabled={applyingTemplates}
                      variant="outline"
                      className="w-full rounded-xl"
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
            <Button onClick={handleRenameCategory} disabled={!editCategoryName.trim()} className="w-full rounded-xl">保存する</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 口座名変更 Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(o) => { if (!o) setEditingAccount(null) }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>口座名を変更</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={editAccountName} onChange={(e) => setEditAccountName(e.target.value)} className="rounded-xl" />
            <Button onClick={handleRenameAccount} disabled={!editAccountName.trim()} className="w-full rounded-xl">保存する</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

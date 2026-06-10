"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  getCategories,
  getAccounts,
  getOrCreateTransferCategory,
  getEntrySuggestions,
  EntrySuggestion,
} from "@/lib/data"
import { Category, Account, TransactionType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export default function AddTransactionPage() {
  const router = useRouter()
  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [toAccount, setToAccount] = useState<string>("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [name, setName] = useState("")
  const [memo, setMemo] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  // 履歴サジェスト
  const [suggestions, setSuggestions] = useState<EntrySuggestion[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<EntrySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameContainerRef = useRef<HTMLDivElement>(null)

  // 連続入力モード
  const [continuousMode, setContinuousMode] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getCategories(), getAccounts(), getEntrySuggestions()]).then(
      ([cats, accs, suggs]) => {
        setCategories(cats)
        setAccounts(accs)
        if (accs.length > 0) setSelectedAccount(accs[0].id)
        setSuggestions(suggs)
      }
    )
  }, [])

  // 品目名エリア外クリックでサジェストを閉じる
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        nameContainerRef.current &&
        !nameContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const filteredCategories = categories.filter((c) => c.type === type)

  const getCategoryIcon = (catId: string) =>
    categories.find((c) => c.id === catId)?.icon ?? "📦"

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType)
    setSelectedCategory("")
    setToAccount("")
    setShowSuggestions(false)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value.replace(/[^0-9]/g, ""))
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!isTransfer && value.length > 0) {
      const filtered = suggestions
        .filter((s) => s.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const applySuggestion = (s: EntrySuggestion) => {
    setName(s.name)
    if (s.type !== type) {
      setType(s.type)
      setToAccount("")
    }
    setSelectedCategory(s.category_id)
    setSelectedAccount(s.account_id)
    setShowSuggestions(false)
  }

  const formattedAmount = amount
    ? new Intl.NumberFormat("ja-JP").format(parseInt(amount))
    : ""

  const isTransfer = type === "transfer"

  const isSubmitDisabled =
    saving ||
    !amount ||
    amount === "0" ||
    (!isTransfer && !selectedCategory) ||
    !selectedAccount ||
    (isTransfer && !toAccount)

  const handleSubmit = async () => {
    if (isSubmitDisabled) return
    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("ログインが必要です")
      setSaving(false)
      return
    }

    try {
      if (isTransfer) {
        const transferCategoryId = await getOrCreateTransferCategory(user.id)
        const pairId = crypto.randomUUID()
        const { error: insertError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              type: "expense",
              amount: parseInt(amount),
              category_id: transferCategoryId,
              account_id: selectedAccount,
              txn_date: date,
              name: name || null,
              memo: memo || null,
              transfer_pair_id: pairId,
            },
            {
              user_id: user.id,
              type: "income",
              amount: parseInt(amount),
              category_id: transferCategoryId,
              account_id: toAccount,
              txn_date: date,
              name: name || null,
              memo: memo || null,
              transfer_pair_id: pairId,
            },
          ])
        if (insertError) throw insertError
      } else {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type,
            amount: parseInt(amount),
            category_id: selectedCategory,
            account_id: selectedAccount,
            txn_date: date,
            name: name || null,
            memo: memo || null,
          })
        if (insertError) throw insertError
      }

      if (continuousMode) {
        // 日付は維持してフォームをリセット
        setAmount("")
        setSelectedCategory("")
        setToAccount("")
        setName("")
        setMemo("")
        setSavedMessage("保存しました")
        setTimeout(() => setSavedMessage(null), 3000)
      } else {
        setAmount("")
        setSelectedCategory("")
        setToAccount("")
        setName("")
        setMemo("")
        setDate(new Date().toISOString().split("T")[0])
        router.push("/")
      }
    } catch {
      setError("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="px-5 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            Add Entry
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            新規追加
          </h1>
        </header>

        <div className="w-full max-w-[1034px] space-y-8">
          {/* Amount Input */}
          <div className="text-center py-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl text-muted-foreground/50">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={formattedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn(
                  "text-5xl md:text-6xl font-light tracking-tight text-center bg-transparent border-none outline-none w-full tabular-nums",
                  type === "income"
                    ? "text-income"
                    : type === "transfer"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
                placeholder="0"
              />
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex rounded-full bg-muted p-1">
            <button
              onClick={() => handleTypeChange("expense")}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm transition-all",
                type === "expense"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              支出
            </button>
            <button
              onClick={() => handleTypeChange("income")}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm transition-all",
                type === "income"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              収入
            </button>
            <button
              onClick={() => handleTypeChange("transfer")}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm transition-all",
                type === "transfer"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              振替
            </button>
          </div>

          {/* Category Selection (非表示 when transfer) */}
          {!isTransfer && (
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
                カテゴリ
              </p>
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  カテゴリがありません。設定画面で追加してください。
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl transition-all",
                        selectedCategory === category.id
                          ? "bg-card ring-1 ring-border shadow-sm"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span className="text-xl mb-1.5">{category.icon}</span>
                      <span className="text-[11px] text-muted-foreground truncate w-full text-center">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Selection */}
          <div>
            <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
              {isTransfer ? "送金元口座" : "口座"}
            </p>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                口座がありません。
                <Link
                  href="/settings?tab=accounts"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  設定画面で追加
                </Link>
                してください。
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account.id)
                      if (toAccount === account.id) setToAccount("")
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all",
                      selectedAccount === account.id
                        ? "bg-card ring-1 ring-border shadow-sm text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-base">{account.icon}</span>
                    {account.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* To Account Selection (transfer のみ) */}
          {isTransfer && (
            <div>
              <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
                振込先口座
              </p>
              {accounts.length <= 1 ? (
                <p className="text-sm text-muted-foreground">
                  振替には2つ以上の口座が必要です。
                  <Link
                    href="/settings?tab=accounts"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    設定画面で追加
                  </Link>
                  してください。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts
                    .filter((account) => account.id !== selectedAccount)
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setToAccount(account.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all",
                          toAccount === account.id
                            ? "bg-card ring-1 ring-border shadow-sm text-foreground"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="text-base">{account.icon}</span>
                        {account.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Name（履歴サジェスト付き） */}
          <div>
            <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
              品目名
            </p>
            <div ref={nameContainerRef} className="relative">
              <Input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (!isTransfer && name.length > 0 && filteredSuggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="例：ランチ、スーパー"
                className="h-12 rounded-xl bg-muted/30 border-0 text-foreground placeholder:text-muted-foreground/50"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-card border border-border shadow-md overflow-hidden">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        applySuggestion(s)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-base">{getCategoryIcon(s.category_id)}</span>
                      <span className="text-foreground">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
              日付
            </p>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-muted/30 border-0 text-foreground"
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
              メモ
            </p>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力..."
              className="min-h-20 rounded-xl bg-muted/30 border-0 resize-none text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {savedMessage && (
            <p className="text-sm text-income text-center">{savedMessage}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* 続けて入力する + 保存ボタン */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={continuousMode}
                onClick={() => setContinuousMode(!continuousMode)}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
                  continuousMode ? "bg-foreground" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                    continuousMode ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
              <span className="text-sm text-muted-foreground">続けて入力する</span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full h-14 rounded-full text-base"
            >
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

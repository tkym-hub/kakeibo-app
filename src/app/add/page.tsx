"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import {
  getCategories,
  getAccounts,
  getOrCreateTransferCategory,
  getEntrySuggestions,
  getCategoryUsageCounts,
  EntrySuggestion,
} from "@/lib/data"
import { Category, Account, TransactionType } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

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
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)

  // 履歴サジェスト
  const [suggestions, setSuggestions] = useState<EntrySuggestion[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<EntrySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameContainerRef = useRef<HTMLDivElement>(null)

  // 連続入力モード
  const [continuousMode, setContinuousMode] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getCategories(),
      getAccounts(),
      getEntrySuggestions(),
      getCategoryUsageCounts(),
    ]).then(([cats, accs, suggs, counts]) => {
      setCategories(cats)
      setAccounts(accs)
      if (accs.length > 0) setSelectedAccount(accs[0].id)
      setSuggestions(suggs)
      setUsageCounts(counts)
    })
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

  // 直近3ヶ月の使用頻度順（同数・履歴なしは getCategories の登録順を維持）
  const INITIAL_CATEGORY_COUNT = 8
  const filteredCategories = categories
    .filter((c) => c.type === type)
    .sort((a, b) => (usageCounts[b.id] ?? 0) - (usageCounts[a.id] ?? 0))

  const isCategoryCollapsible = filteredCategories.length > INITIAL_CATEGORY_COUNT
  const visibleCategories = (() => {
    if (!isCategoryCollapsible || categoriesExpanded) return filteredCategories
    const top = filteredCategories.slice(0, INITIAL_CATEGORY_COUNT)
    // 選択中カテゴリが上位8個の外にある場合は末尾と入れ替えて見えるようにする
    if (selectedCategory && !top.some((c) => c.id === selectedCategory)) {
      const selected = filteredCategories.find((c) => c.id === selectedCategory)
      if (selected) top[INITIAL_CATEGORY_COUNT - 1] = selected
    }
    return top
  })()

  const getCategoryIcon = (catId: string) =>
    categories.find((c) => c.id === catId)?.icon ?? "📦"

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType)
    setSelectedCategory("")
    setToAccount("")
    setShowSuggestions(false)
    setCategoriesExpanded(false)
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

  const amountColor = isTransfer
    ? "text-muted-foreground"
    : type === "income"
    ? "text-primary"
    : "text-foreground"

  return (
    <AppLayout>
      <div className="max-w-[640px] lg:max-w-[1100px] mx-auto px-6 md:px-10 pt-10 pb-16 md:pt-12 md:pb-[72px] lg:pt-10 lg:pb-14">
        {/* Header */}
        <p className="text-center italic font-serif text-[13px] md:text-sm tracking-[0.14em] text-muted-foreground mb-8 md:mb-10 lg:mb-8">
          Add Entry
        </p>

        {/* lg以上: 左=金額+収支タブ / 右=入力フィールド群 の2カラム（iPad横で1画面に収めるため） */}
        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-14 lg:items-center">
        <div>
        {/* Amount Block */}
        <div className="text-center border-b border-border-strong pb-6 md:pb-8">
          <div className="inline-flex items-baseline justify-center gap-2 md:gap-2.5">
            <span className="font-serif font-light text-xl md:text-[28px] text-muted-foreground">
              ¥
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className={cn(
                "font-serif font-light text-5xl md:text-[80px] leading-none tracking-[-0.015em] text-center bg-transparent border-none outline-none tabular-nums w-[8ch]",
                amountColor
              )}
            />
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex justify-center gap-8 md:gap-11 py-5 border-b border-border text-sm">
          <button
            onClick={() => handleTypeChange("expense")}
            className={cn(
              "pb-[5px]",
              type === "expense"
                ? "font-medium border-b-[1.5px] border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            支出
          </button>
          <button
            onClick={() => handleTypeChange("income")}
            className={cn(
              "pb-[5px]",
              type === "income"
                ? "font-medium border-b-[1.5px] border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            収入
          </button>
          <button
            onClick={() => handleTypeChange("transfer")}
            className={cn(
              "pb-[5px]",
              type === "transfer"
                ? "font-medium border-b-[1.5px] border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            振替
          </button>
        </div>
        </div>

        <div className="lg:[&>:first-child]:mt-0">
        {/* Category Selection (非表示 when transfer) */}
        {!isTransfer && (
          <div className="mt-10 lg:mt-7">
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-4 lg:mb-3">
              カテゴリ
            </p>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                カテゴリがありません。設定画面で追加してください。
              </p>
            ) : (
              <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                {visibleCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 py-3.5 lg:py-2.5 px-2 rounded-[6px] border transition-colors",
                      selectedCategory === category.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent"
                    )}
                  >
                    <span className="text-[19px]">{category.icon}</span>
                    <span
                      className={cn(
                        "text-[11.5px] truncate w-full text-center",
                        selectedCategory === category.id
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {category.name}
                    </span>
                  </button>
                ))}
                {isCategoryCollapsible && (
                  <button
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="flex flex-col items-center justify-center gap-1.5 py-3.5 lg:py-2.5 px-2 rounded-[6px] border border-dashed border-border-mid transition-colors"
                  >
                    <span className="text-[19px]">{categoriesExpanded ? "−" : "⋯"}</span>
                    <span className="text-[11.5px] truncate w-full text-center text-muted-foreground">
                      {categoriesExpanded ? "閉じる" : "すべて表示"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Account Selection */}
        <div className="mt-9 lg:mt-7">
          <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-3.5 lg:mb-3">
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
            <div className="flex flex-wrap gap-2.5">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account.id)
                    if (toAccount === account.id) setToAccount("")
                  }}
                  className={cn(
                    "flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[13px] border transition-colors",
                    selectedAccount === account.id
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border-mid text-muted-foreground"
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
          <div className="mt-9">
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-3.5">
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
              <div className="flex flex-wrap gap-2.5">
                {accounts
                  .filter((account) => account.id !== selectedAccount)
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setToAccount(account.id)}
                      className={cn(
                        "flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[13px] border transition-colors",
                        toAccount === account.id
                          ? "border-primary bg-primary/5 font-medium text-foreground"
                          : "border-border-mid text-muted-foreground"
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

        {/* Name + Date */}
        <div className="mt-10 lg:mt-6 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 md:gap-10">
          {/* Name（履歴サジェスト付き） */}
          <div>
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-1.5">
              品目名
            </p>
            <div ref={nameContainerRef} className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (!isTransfer && name.length > 0 && filteredSuggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="例：ランチ、スーパー"
                className="w-full py-2.5 border-b border-input bg-transparent outline-none text-[14.5px] text-foreground placeholder:text-muted-foreground/70"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md bg-card border border-border shadow-md overflow-hidden">
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
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-1.5">
              日付
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2.5 border-b border-input bg-transparent outline-none font-serif text-[15px] text-foreground"
            />
          </div>
        </div>

        {/* Memo */}
        <div className="mt-8 lg:mt-6">
          <p className="text-[11px] tracking-[0.12em] text-muted-foreground mb-1.5">
            メモ
          </p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモを入力..."
            rows={1}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = "auto"
              el.style.height = `${el.scrollHeight}px`
            }}
            className="w-full py-2.5 border-b border-input bg-transparent outline-none resize-none overflow-hidden text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {savedMessage && (
          <p className="text-sm text-primary text-center mt-6">{savedMessage}</p>
        )}
        {error && (
          <p className="text-sm text-destructive text-center mt-6">{error}</p>
        )}

        {/* 続けて入力する */}
        <div className="mt-11 lg:mt-6 mb-5 lg:mb-4 flex items-center justify-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={continuousMode}
            onClick={() => setContinuousMode(!continuousMode)}
            className={cn(
              "relative inline-flex h-[19px] w-[34px] flex-shrink-0 items-center rounded-full transition-colors",
              continuousMode ? "bg-panel" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-[15px] w-[15px] transform rounded-full bg-white shadow-sm transition-transform",
                continuousMode ? "translate-x-[17px]" : "translate-x-[2px]"
              )}
            />
          </button>
          <span className="text-[13px] text-muted-foreground">続けて入力する</span>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full h-[52px] rounded-full bg-panel text-panel-foreground text-[14.5px] tracking-[0.08em] flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        </div>
        </div>
      </div>
    </AppLayout>
  )
}

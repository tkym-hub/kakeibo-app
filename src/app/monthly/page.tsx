"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { formatCurrency, getTransactions, getAccounts, getCategories, getTemplates, getCurrentMonth, shiftMonth, getOrCreateTransferCategory } from "@/lib/data"
import { Transaction, Account, Category, RecurringTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const INVESTMENT_CATEGORIES = new Set(["投資"])

const KIND_LABELS: Record<string, string> = {
  bank: "銀行",
  cash: "現金",
  credit_card: "クレカ",
  e_money: "電子マネー",
}
const KIND_ORDER = ["bank", "cash", "credit_card", "e_money"]

interface BreakdownSectionProps {
  title: string
  total: number
  items: { name: string; amount: number }[]
  type?: "income" | "expense" | "investment"
  emptyLabel?: string
}

function BreakdownSection({ title, total, items, type = "expense", emptyLabel }: BreakdownSectionProps) {
  const totalColorClass =
    type === "income" ? "text-income" : total === 0 ? "text-muted-foreground" : "text-foreground"

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-border-strong pb-[10px] mb-1.5">
        <span className="text-xs tracking-[0.1em] text-muted-foreground">{title}</span>
        <span className={cn("font-serif text-xl tabular-nums", totalColorClass)}>
          {formatCurrency(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/80 py-3">{emptyLabel ?? "データがありません"}</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index} className="flex items-baseline gap-3 py-[11px]">
              <span className="text-[13.5px] text-foreground">{item.name}</span>
              <span className="flex-1 border-b border-dotted border-leader -translate-y-1" />
              <span className="font-serif text-[15px] tabular-nums text-foreground">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


export default function MonthlyDetailsPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [debitTransferring, setDebitTransferring] = useState<string | null>(null)

  const untilDate = useMemo(() => {
    const match = currentMonth.match(/(\d{4})年(\d{1,2})月/)
    if (!match) return undefined
    const y = parseInt(match[1]), m = parseInt(match[2])
    const lastDay = new Date(y, m, 0).getDate()
    return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  }, [currentMonth])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransactions(currentMonth),
      getAccounts(untilDate),

      getCategories(),
      getTemplates(),
    ]).then(([txs, accs, cats, tpls]) => {
      setTransactions(txs)
      setAccounts(accs)
      setCategories(cats)
      setTemplates(tpls)
    }).finally(() => setLoading(false))
  }, [currentMonth])

  async function handleDebitTransfer(creditAccount: Account) {
    if (!creditAccount.debit_account_id) return
    // transfer_pair_id 付きの expense（カードからの振替）は除外して二重計上を防ぐ
    const amount = transactions
      .filter((t) => t.account_id === creditAccount.id && t.type === "expense" && !t.transfer_pair_id)
      .reduce((sum, t) => sum + t.amount, 0)
    if (amount === 0) return
    setDebitTransferring(creditAccount.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const transferCategoryId = await getOrCreateTransferCategory(user.id)
      const txnDate = untilDate ?? new Date().toISOString().split("T")[0]
      const pairId = crypto.randomUUID()

      const { error } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: "expense",
          amount,
          category_id: transferCategoryId,
          account_id: creditAccount.debit_account_id,
          txn_date: txnDate,
          memo: `${creditAccount.name} 引き落とし`,
          transfer_pair_id: pairId,
        },
        {
          user_id: user.id,
          type: "income",
          amount,
          category_id: transferCategoryId,
          account_id: creditAccount.id,
          txn_date: txnDate,
          memo: `${creditAccount.name} 引き落とし`,
          transfer_pair_id: pairId,
        },
      ])
      if (error) throw error

      const [updatedAccounts, updatedTxs] = await Promise.all([
        getAccounts(untilDate),
        getTransactions(currentMonth),
      ])
      setAccounts(updatedAccounts)
      setTransactions(updatedTxs)
    } catch {
      alert("引き落とし処理に失敗しました")
    } finally {
      setDebitTransferring(null)
    }
  }

  const monthlyBreakdown = useMemo(() => {
    // 固定費カテゴリIDの判定:
    //   1. categories.is_fixed = true のもの
    //   2. recurring_templates に登録されているカテゴリ（ユーザーが固定費として登録したもの）
    const fixedCategoryIds = new Set([
      ...categories.filter((c) => c.is_fixed).map((c) => c.id),
      ...templates.map((t) => t.category_id),
    ])

    const groupByCategory = (txs: Transaction[]) => {
      const grouped = txs.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})
      return Object.entries(grouped).map(([name, amount]) => ({ name, amount }))
    }

    const incomeTxs = transactions.filter((t) => t.type === "income" && !t.transfer_pair_id)
    const expenseTxs = transactions.filter((t) => t.type === "expense" && !t.transfer_pair_id)
    const investmentTxs = expenseTxs.filter((t) => INVESTMENT_CATEGORIES.has(t.category))
    const fixedTxs = expenseTxs.filter((t) => fixedCategoryIds.has(t.category_id))
    const variableTxs = expenseTxs.filter(
      (t) => !fixedCategoryIds.has(t.category_id) && !INVESTMENT_CATEGORIES.has(t.category)
    )

    return {
      income: {
        total: incomeTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(incomeTxs),
      },
      fixedExpenses: {
        total: fixedTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(fixedTxs),
      },
      variableExpenses: {
        total: variableTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(variableTxs),
      },
      investments: {
        total: investmentTxs.reduce((s, t) => s + t.amount, 0),
        items: groupByCategory(investmentTxs),
      },
    }
  }, [transactions, categories, templates])

  const totalExpense = monthlyBreakdown.fixedExpenses.total + monthlyBreakdown.variableExpenses.total
  const balance = monthlyBreakdown.income.total - totalExpense - monthlyBreakdown.investments.total

  // クレカの未引き落とし額: expense合計 - 振替income合計
  const monthlyUnpaidByAccount = useMemo(() => {
    const expense: Record<string, number> = {}
    const transferIncome: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === "expense" && !t.transfer_pair_id)
        expense[t.account_id] = (expense[t.account_id] || 0) + t.amount
      if (t.type === "income" && t.transfer_pair_id)
        transferIncome[t.account_id] = (transferIncome[t.account_id] || 0) + t.amount
    }
    const result: Record<string, number> = {}
    for (const id of new Set([...Object.keys(expense), ...Object.keys(transferIncome)])) {
      result[id] = (expense[id] ?? 0) - (transferIncome[id] ?? 0)
    }
    return result
  }, [transactions])

  const accountsByKind = useMemo(() => {
    const grouped: Record<string, { accounts: Account[]; total: number }> = {}
    for (const acc of accounts) {
      if (!grouped[acc.kind]) grouped[acc.kind] = { accounts: [], total: 0 }
      grouped[acc.kind].accounts.push(acc)
      grouped[acc.kind].total += acc.balance
    }
    return KIND_ORDER.filter((k) => grouped[k]).map((k) => ({ kind: k, ...grouped[k] }))
  }, [accounts])

  return (
    <AppLayout>
      <div className="max-w-[920px] mx-auto px-5 pt-8 pb-16 md:px-10 md:pt-12 md:pb-[72px]">
        {/* Header */}
        <header className="mb-9">
          <p className="italic font-serif text-sm tracking-[0.14em] text-muted-foreground mb-3">
            Monthly Report
          </p>
          <MonthSelector
            month={currentMonth}
            onPrevious={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
            onNext={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
            size="lg"
          />
        </header>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <>
            {/* Summary Bar (深緑パネル) */}
            <div className="flex flex-col sm:flex-row rounded-[6px] bg-panel text-panel-foreground px-6 py-6 sm:px-11 sm:py-7 mb-12 gap-6 sm:gap-0">
              <div className="flex-1 sm:pl-9 sm:first:pl-0">
                <p className="text-[11px] tracking-[0.12em] opacity-65 mb-2">収入</p>
                <p className="font-serif text-2xl tabular-nums">
                  {formatCurrency(monthlyBreakdown.income.total)}
                </p>
              </div>
              <div className="flex-1 sm:border-l sm:border-panel-foreground/20 sm:pl-9">
                <p className="text-[11px] tracking-[0.12em] opacity-65 mb-2">支出</p>
                <p className="font-serif text-2xl tabular-nums">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="flex-1 sm:border-l sm:border-panel-foreground/20 sm:pl-9">
                <p className="text-[11px] tracking-[0.12em] opacity-65 mb-2">投資</p>
                <p className="font-serif text-2xl tabular-nums">
                  {formatCurrency(monthlyBreakdown.investments.total)}
                </p>
              </div>
              <div className="flex-1 sm:border-l sm:border-panel-foreground/20 sm:pl-9">
                <p className="text-[11px] tracking-[0.12em] opacity-65 mb-2">収支</p>
                <p className="font-serif text-2xl tabular-nums">
                  {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
                </p>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              <BreakdownSection
                title="収入"
                total={monthlyBreakdown.income.total}
                items={monthlyBreakdown.income.items}
                type="income"
              />
              <BreakdownSection
                title="固定費"
                total={monthlyBreakdown.fixedExpenses.total}
                items={monthlyBreakdown.fixedExpenses.items}
                type="expense"
              />
              <BreakdownSection
                title="変動費"
                total={monthlyBreakdown.variableExpenses.total}
                items={monthlyBreakdown.variableExpenses.items}
                type="expense"
              />
              <BreakdownSection
                title="投資"
                total={monthlyBreakdown.investments.total}
                items={monthlyBreakdown.investments.items}
                type="investment"
                emptyLabel="今月の投資はありません"
              />
            </div>

            {/* Accounts */}
            <div className="mt-14">
              <p className="italic font-serif text-sm tracking-[0.14em] text-muted-foreground mb-5">
                Accounts
              </p>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  口座が登録されていません。<Link href="/settings?tab=accounts" className="underline underline-offset-2 hover:text-foreground transition-colors">設定画面で追加</Link>してください。
                </p>
              ) : (
                <div>
                  {accountsByKind.map(({ kind, accounts: kindAccounts, total }, groupIndex) => (
                    <div key={kind} className={cn(groupIndex > 0 && "mt-8")}>
                      <div className="flex items-baseline justify-between border-b border-border-strong pb-[10px] mb-1.5">
                        <span className="text-xs tracking-[0.1em] text-muted-foreground">
                          {KIND_LABELS[kind]}
                        </span>
                        <span className="font-serif text-xl tabular-nums text-foreground">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      {kindAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center gap-3 py-3.5 border-b border-border"
                        >
                          <span className="text-[15px]">{account.icon}</span>
                          <span className="flex-1 text-[13.5px] text-foreground">{account.name}</span>
                          {account.kind === "credit_card" && account.debit_account_id && (monthlyUnpaidByAccount[account.id] ?? 0) > 0 && (
                            <button
                              onClick={() => handleDebitTransfer(account)}
                              disabled={debitTransferring === account.id}
                              className="text-[11.5px] px-3.5 py-1.5 rounded-full bg-primary/10 text-primary-deep hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                              {debitTransferring === account.id ? "処理中..." : "引き落とし"}
                            </button>
                          )}
                          <span className="font-serif text-[15px] tabular-nums text-foreground">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

import { supabase } from "@/lib/supabase"
import { Transaction, Category, Account, RecurringTemplate, TransactionType } from "@/lib/types"

// カテゴリアイコン静的マッピング（DBにiconが未設定の場合のフォールバック）
const CATEGORY_ICONS: Record<string, string> = {
  "給与": "💼", "副業": "💻", "投資収入": "📈", "その他収入": "💰",
  "食費": "🍽️", "日用品": "🧴", "交通費": "🚃", "住居費": "🏠",
  "光熱費": "💡", "通信費": "📱", "医療費": "🏥", "娯楽": "🎮",
  "衣服": "👕", "教育": "📚", "投資": "📊", "その他": "📦",
  "保険料": "🛡️",
}

const ACCOUNT_ICONS: Record<string, string> = {
  "bank": "🏦", "cash": "💴", "credit_card": "💳", "e_money": "📱",
}

// デフォルトカテゴリ（初回ユーザー向けシード）
export const DEFAULT_CATEGORIES = [
  { name: "給与",     type: "income",  sort_order: 1,  is_fixed: false },
  { name: "副業",     type: "income",  sort_order: 2,  is_fixed: false },
  { name: "投資収入", type: "income",  sort_order: 3,  is_fixed: false },
  { name: "その他収入",type:"income",  sort_order: 4,  is_fixed: false },
  { name: "食費",     type: "expense", sort_order: 10, is_fixed: false },
  { name: "日用品",   type: "expense", sort_order: 11, is_fixed: false },
  { name: "交通費",   type: "expense", sort_order: 12, is_fixed: false },
  { name: "住居費",   type: "expense", sort_order: 13, is_fixed: true  },
  { name: "光熱費",   type: "expense", sort_order: 14, is_fixed: true  },
  { name: "通信費",   type: "expense", sort_order: 15, is_fixed: true  },
  { name: "保険料",   type: "expense", sort_order: 16, is_fixed: true  },
  { name: "医療費",   type: "expense", sort_order: 17, is_fixed: false },
  { name: "娯楽",     type: "expense", sort_order: 18, is_fixed: false },
  { name: "衣服",     type: "expense", sort_order: 19, is_fixed: false },
  { name: "教育",     type: "expense", sort_order: 20, is_fixed: false },
  { name: "投資",     type: "expense", sort_order: 21, is_fixed: false },
  { name: "その他",   type: "expense", sort_order: 22, is_fixed: false },
] as const

// --- 型定義 ---

export type CardLedgerRow = {
  account_id: string
  type: TransactionType
  amount: number
  date: string
  transfer_pair_id: string | null
}

// クレカの締め期間（start〜end が利用期間、paymentDate が引き落とし日）
export type StatementPeriod = {
  start: string
  end: string
  paymentDate: string
}

export type EntrySuggestion = {
  name: string
  category_id: string
  account_id: string
  type: TransactionType
  amount: number
}

// --- データ取得関数 ---

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, is_fixed, icon")
    .eq("is_active", true)
    .order("sort_order")
    .order("name")

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    is_fixed: row.is_fixed,
    icon: row.icon ?? CATEGORY_ICONS[row.name] ?? "📦",
  }))
}

export async function getAccounts(untilDate?: string): Promise<Account[]> {
  const { data: accountsData, error } = await supabase
    .from("accounts")
    .select("id, name, kind, opening_balance, debit_account_id, icon, closing_day, payment_day, payment_month_offset")
    .eq("is_active", true)
    .order("sort_order")
    .order("name")

  if (error) throw error

  // 口座ごとの累積入出金を一括取得（untilDate指定時はその日以前のみ）
  let txQuery = supabase.from("transactions").select("account_id, type, amount")
  if (untilDate) txQuery = txQuery.lte("txn_date", untilDate)
  const { data: txData, error: txError } = await txQuery

  if (txError) throw txError

  const balanceMap: Record<string, number> = {}
  for (const tx of txData ?? []) {
    if (!balanceMap[tx.account_id]) balanceMap[tx.account_id] = 0
    if (tx.type === "income") balanceMap[tx.account_id] += Number(tx.amount)
    else if (tx.type === "expense") balanceMap[tx.account_id] -= Number(tx.amount)
  }

  return (accountsData ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    opening_balance: Number(row.opening_balance),
    balance: Number(row.opening_balance) + (balanceMap[row.id] ?? 0),
    icon: row.icon ?? ACCOUNT_ICONS[row.kind] ?? "🏦",
    debit_account_id: row.debit_account_id ?? null,
    closing_day: row.closing_day ?? null,
    payment_day: row.payment_day ?? null,
    payment_month_offset: row.payment_month_offset ?? 0,
  }))
}

// クレカ口座の締め期間計算用に、対象口座の全期間の明細を取得（月をまたぐ期間に対応するため月絞りをしない）
export async function getCardLedger(accountIds: string[]): Promise<CardLedgerRow[]> {
  if (accountIds.length === 0) return []

  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, type, amount, txn_date, transfer_pair_id")
    .in("account_id", accountIds)

  if (error) throw error

  return (data ?? []).map((row) => ({
    account_id: row.account_id,
    type: row.type,
    amount: Number(row.amount),
    date: row.txn_date,
    transfer_pair_id: row.transfer_pair_id ?? null,
  }))
}

export async function getTransactions(month?: string): Promise<Transaction[]> {
  let query = supabase
    .from("transactions")
    .select(`
      id, type, amount, txn_date, name, memo,
      category_id, categories(name),
      account_id, accounts(name),
      transfer_pair_id
    `)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (month) {
    const match = month.match(/(\d{4})年(\d{1,2})月/)
    if (match) {
      const year = parseInt(match[1])
      const m = parseInt(match[2])
      const start = `${year}-${String(m).padStart(2, "0")}-01`
      const lastDay = new Date(year, m, 0).getDate()
      const end = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      query = query.gte("txn_date", start).lte("txn_date", end)
    }
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => {
    const categoryName = (row.categories as unknown as { name: string } | null)?.name ?? ""
    const accountName = (row.accounts as unknown as { name: string } | null)?.name ?? ""
    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      category_id: row.category_id,
      category: categoryName,
      account_id: row.account_id,
      account: accountName,
      date: row.txn_date,
      name: row.name ?? undefined,
      memo: row.memo ?? undefined,
      icon: CATEGORY_ICONS[categoryName] ?? "📦",
      transfer_pair_id: row.transfer_pair_id ?? null,
    }
  })
}

// 品目名サジェスト用: 直近200件の name 付き明細を取得し name で重複排除（最新優先）
export async function getEntrySuggestions(): Promise<EntrySuggestion[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("name, category_id, account_id, type, amount")
    .not("name", "is", null)
    .is("transfer_pair_id", null)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) throw error

  const seen = new Set<string>()
  const result: EntrySuggestion[] = []
  for (const row of data ?? []) {
    if (!row.name || seen.has(row.name)) continue
    seen.add(row.name)
    result.push({
      name: row.name,
      category_id: row.category_id,
      account_id: row.account_id,
      type: row.type as TransactionType,
      amount: Number(row.amount),
    })
  }
  return result
}

// カテゴリ表示順用: 直近3ヶ月の取引からカテゴリ別の使用件数を集計
export async function getCategoryUsageCounts(): Promise<Record<string, number>> {
  const since = new Date()
  since.setMonth(since.getMonth() - 3)
  const sinceStr = since.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id")
    .gte("txn_date", sinceStr)

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (!row.category_id) continue
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
  }
  return counts
}

// 振替カテゴリIDを取得（なければ is_active=false で自動作成）
export async function getOrCreateTransferCategory(userId: string): Promise<string> {
  const { data: existingCats, error: catFetchError } = await supabase
    .from("categories")
    .select("id")
    .eq("type", "transfer")
    .eq("user_id", userId)
    .limit(1)
  if (catFetchError) throw catFetchError

  if (existingCats && existingCats.length > 0) {
    return existingCats[0].id
  }

  const { data: newCat, error: catError } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: "振替", type: "transfer", sort_order: 99, is_active: false })
    .select("id")
    .single()
  if (catError || !newCat) throw catError
  return newCat.id
}

export async function getTemplates(): Promise<RecurringTemplate[]> {
  const { data, error } = await supabase
    .from("recurring_templates")
    .select(`
      id, name, amount, type, day_of_month,
      category_id, categories(name),
      account_id, accounts(name)
    `)
    .eq("is_active", true)
    .order("day_of_month")

  if (error) throw error

  return (data ?? []).map((row) => {
    const categoryName = (row.categories as unknown as { name: string } | null)?.name ?? ""
    const accountName = (row.accounts as unknown as { name: string } | null)?.name ?? ""
    return {
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
      type: row.type,
      day_of_month: row.day_of_month,
      category_id: row.category_id,
      category: categoryName,
      account_id: row.account_id,
      account: accountName,
      icon: CATEGORY_ICONS[categoryName] ?? "📦",
    }
  })
}

// --- ユーティリティ関数 ---

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("ja-JP").format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

export function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>()
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const transaction of sorted) {
    const dateKey = transaction.date
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(transaction)
  }

  return grouped
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
}

export function shiftMonth(month: string, delta: number): string {
  const match = month.match(/(\d{4})年(\d{1,2})月/)
  if (!match) return month
  const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1 + delta)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// --- クレカ締め期間 ---

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/**
 * 対象月に締め日が来る利用期間と、その期間の引き落とし日を返す。
 * 例: 2026年9月 / 18日締め・翌月10日払い → 2026-08-19〜2026-09-18、引き落とし 2026-10-10
 * closing_day 未設定の口座は従来どおり月初〜月末を1期間とし、引き落としは末日扱い。
 */
export function getStatementPeriod(
  month: string,
  account: Pick<Account, "closing_day" | "payment_day" | "payment_month_offset">
): StatementPeriod | null {
  const match = month.match(/(\d{4})年(\d{1,2})月/)
  if (!match) return null
  const year = parseInt(match[1])
  const m = parseInt(match[2])

  if (!account.closing_day) {
    const last = lastDayOfMonth(year, m)
    const end = toDateString(year, m, last)
    return { start: toDateString(year, m, 1), end, paymentDate: end }
  }

  const closing = account.closing_day
  const end = toDateString(year, m, Math.min(closing, lastDayOfMonth(year, m)))

  // 期間の開始 = 前月の締め日の翌日
  const prev = new Date(year, m - 2, 1)
  const prevYear = prev.getFullYear()
  const prevMonth = prev.getMonth() + 1
  const startDate = new Date(prevYear, prevMonth - 1, Math.min(closing, lastDayOfMonth(prevYear, prevMonth)))
  startDate.setDate(startDate.getDate() + 1)
  const start = toDateString(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate())

  // 引き落とし月 = 締め月 + payment_month_offset
  const payMonth = new Date(year, m - 1 + (account.payment_month_offset ?? 0), 1)
  const payYear = payMonth.getFullYear()
  const payMonthNum = payMonth.getMonth() + 1
  const payLast = lastDayOfMonth(payYear, payMonthNum)
  const payDay = account.payment_day ?? payLast
  const paymentDate = toDateString(payYear, payMonthNum, Math.min(payDay, payLast))

  return { start, end, paymentDate }
}

// 「8/19〜9/18」形式の期間ラベル
export function formatPeriodLabel(period: StatementPeriod): string {
  const short = (d: string) => {
    const [, m, day] = d.split("-")
    return `${parseInt(m)}/${parseInt(day)}`
  }
  return `${short(period.start)}〜${short(period.end)}`
}

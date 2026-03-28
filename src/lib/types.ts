export type TransactionType = "income" | "expense" | "transfer"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category_id: string
  category: string    // カテゴリ名（表示用、JOIN済み）
  account_id: string
  account: string     // 口座名（表示用、JOIN済み）
  date: string        // YYYY-MM-DD（txn_dateのエイリアス）
  memo?: string
  icon?: string       // カテゴリアイコン（静的マッピング）
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  is_fixed: boolean
  icon: string
}

export interface Account {
  id: string
  name: string
  kind: "bank" | "cash" | "credit_card" | "e_money"
  opening_balance: number
  balance: number     // opening_balance + 累積入出金
  icon: string
}

export interface RecurringTemplate {
  id: string
  name: string
  amount: number
  type: TransactionType
  day_of_month: number
  category_id: string
  category: string
  account_id: string
  account: string
  icon?: string
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
  savingsRate: number
  categoryBreakdown: { name: string; value: number; fill: string }[]
}

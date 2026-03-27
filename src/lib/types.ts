export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  account: string
  date: string
  memo?: string
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
}

export interface Account {
  id: string
  name: string
  balance: number
  icon: string
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
  savingsRate: number
  categoryBreakdown: { name: string; value: number; fill: string }[]
}

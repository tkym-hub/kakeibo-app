/**
 * データアクセス層
 *
 * 現在はモックデータを返す。
 * 将来 Supabase に切り替える場合、この関数の実装だけ変更すればよい。
 * コンポーネント・ページはここ経由でのみデータを取得する。
 */

import { Transaction, Category, Account, MonthlyData } from "@/lib/types"
import {
  categories as mockCategories,
  accounts as mockAccounts,
  transactions as mockTransactions,
  monthlyData as mockMonthlyData,
} from "./mock"

// --- データ取得関数 ---

export async function getCategories(): Promise<Category[]> {
  return mockCategories
}

export async function getAccounts(): Promise<Account[]> {
  return mockAccounts
}

export async function getTransactions(): Promise<Transaction[]> {
  return mockTransactions
}

export async function getMonthlyData(_month?: string): Promise<MonthlyData> {
  return mockMonthlyData
}

// --- 同期アクセス（コンポーネント内での直接参照用） ---
// Server Components への移行後は非同期関数を使うこと

export { mockCategories as categories, mockAccounts as accounts, mockTransactions as transactions, mockMonthlyData as monthlyData }

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
  const date = new Date(dateString)
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

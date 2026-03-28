import { Transaction, Category, Account, MonthlyData } from "@/lib/types"

export const categories: Category[] = [
  { id: "1", name: "給与", type: "income", icon: "💼", is_fixed: false },
  { id: "2", name: "副業", type: "income", icon: "💻", is_fixed: false },
  { id: "3", name: "投資収入", type: "income", icon: "📈", is_fixed: false },
  { id: "4", name: "その他収入", type: "income", icon: "💰", is_fixed: false },
  { id: "5", name: "食費", type: "expense", icon: "🍽️", is_fixed: false },
  { id: "6", name: "日用品", type: "expense", icon: "🧴", is_fixed: false },
  { id: "7", name: "交通費", type: "expense", icon: "🚃", is_fixed: false },
  { id: "8", name: "住居費", type: "expense", icon: "🏠", is_fixed: true },
  { id: "9", name: "光熱費", type: "expense", icon: "💡", is_fixed: true },
  { id: "10", name: "通信費", type: "expense", icon: "📱", is_fixed: true },
  { id: "11", name: "医療費", type: "expense", icon: "🏥", is_fixed: false },
  { id: "12", name: "娯楽", type: "expense", icon: "🎮", is_fixed: false },
  { id: "13", name: "衣服", type: "expense", icon: "👕", is_fixed: false },
  { id: "14", name: "教育", type: "expense", icon: "📚", is_fixed: false },
  { id: "15", name: "投資", type: "expense", icon: "📊", is_fixed: false },
  { id: "16", name: "その他", type: "expense", icon: "📦", is_fixed: false },
]

export const accounts: Account[] = [
  { id: "1", name: "三菱UFJ銀行", kind: "bank", opening_balance: 1250000, balance: 1250000, icon: "🏦" },
  { id: "2", name: "楽天銀行", kind: "bank", opening_balance: 580000, balance: 580000, icon: "🏦" },
  { id: "3", name: "PayPay", kind: "e_money", opening_balance: 45000, balance: 45000, icon: "📱" },
  { id: "4", name: "現金", kind: "cash", opening_balance: 32000, balance: 32000, icon: "💴" },
]

export const transactions: Transaction[] = [
  { id: "1", type: "income", amount: 380000, category_id: "1", category: "給与", account_id: "1", account: "三菱UFJ銀行", date: "2026-04-25", memo: "4月分給与" },
  { id: "2", type: "expense", amount: 95000, category_id: "8", category: "住居費", account_id: "1", account: "三菱UFJ銀行", date: "2026-04-27", memo: "家賃" },
  { id: "14", type: "expense", amount: 50000, category_id: "15", category: "投資", account_id: "2", account: "楽天銀行", date: "2026-04-05", memo: "積立NISA" },
]

export const monthlyData: MonthlyData = {
  month: "2026年4月",
  income: 405000,
  expense: 220900,
  balance: 184100,
  savingsRate: 45.5,
  categoryBreakdown: [
    { name: "住居費", value: 95000, fill: "var(--color-chart-1)" },
    { name: "投資", value: 50000, fill: "var(--color-chart-2)" },
    { name: "食費", value: 25200, fill: "var(--color-chart-3)" },
    { name: "光熱費", value: 16500, fill: "var(--color-chart-4)" },
    { name: "交通費", value: 15000, fill: "var(--color-chart-5)" },
    { name: "その他", value: 19200, fill: "var(--color-muted-foreground)" },
  ],
}

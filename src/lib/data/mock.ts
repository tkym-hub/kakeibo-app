import { Transaction, Category, Account, MonthlyData } from "@/lib/types"

export const categories: Category[] = [
  { id: "1", name: "給与", type: "income", icon: "💼" },
  { id: "2", name: "副業", type: "income", icon: "💻" },
  { id: "3", name: "投資収入", type: "income", icon: "📈" },
  { id: "4", name: "その他収入", type: "income", icon: "💰" },
  { id: "5", name: "食費", type: "expense", icon: "🍽️" },
  { id: "6", name: "日用品", type: "expense", icon: "🧴" },
  { id: "7", name: "交通費", type: "expense", icon: "🚃" },
  { id: "8", name: "住居費", type: "expense", icon: "🏠" },
  { id: "9", name: "光熱費", type: "expense", icon: "💡" },
  { id: "10", name: "通信費", type: "expense", icon: "📱" },
  { id: "11", name: "医療費", type: "expense", icon: "🏥" },
  { id: "12", name: "娯楽", type: "expense", icon: "🎮" },
  { id: "13", name: "衣服", type: "expense", icon: "👕" },
  { id: "14", name: "教育", type: "expense", icon: "📚" },
  { id: "15", name: "投資", type: "expense", icon: "📊" },
  { id: "16", name: "その他", type: "expense", icon: "📦" },
]

export const accounts: Account[] = [
  { id: "1", name: "三菱UFJ銀行", balance: 1250000, icon: "🏦" },
  { id: "2", name: "楽天銀行", balance: 580000, icon: "🏦" },
  { id: "3", name: "PayPay", balance: 45000, icon: "💳" },
  { id: "4", name: "現金", balance: 32000, icon: "💴" },
]

export const transactions: Transaction[] = [
  { id: "1", type: "income", amount: 380000, category: "給与", account: "三菱UFJ銀行", date: "2026-04-25", memo: "4月分給与" },
  { id: "2", type: "expense", amount: 95000, category: "住居費", account: "三菱UFJ銀行", date: "2026-04-27", memo: "家賃" },
  { id: "3", type: "expense", amount: 8500, category: "光熱費", account: "三菱UFJ銀行", date: "2026-04-15", memo: "電気代" },
  { id: "4", type: "expense", amount: 4200, category: "光熱費", account: "三菱UFJ銀行", date: "2026-04-15", memo: "ガス代" },
  { id: "5", type: "expense", amount: 3800, category: "光熱費", account: "三菱UFJ銀行", date: "2026-04-15", memo: "水道代" },
  { id: "6", type: "expense", amount: 6800, category: "通信費", account: "楽天銀行", date: "2026-04-10", memo: "スマホ料金" },
  { id: "7", type: "expense", amount: 4500, category: "通信費", account: "楽天銀行", date: "2026-04-10", memo: "インターネット" },
  { id: "8", type: "expense", amount: 12800, category: "食費", account: "PayPay", date: "2026-04-20", memo: "スーパー" },
  { id: "9", type: "expense", amount: 3500, category: "食費", account: "現金", date: "2026-04-21", memo: "コンビニ" },
  { id: "10", type: "expense", amount: 8900, category: "食費", account: "PayPay", date: "2026-04-22", memo: "外食" },
  { id: "11", type: "expense", amount: 2300, category: "日用品", account: "PayPay", date: "2026-04-18", memo: "ドラッグストア" },
  { id: "12", type: "expense", amount: 15000, category: "交通費", account: "現金", date: "2026-04-01", memo: "定期券" },
  { id: "13", type: "expense", amount: 5600, category: "娯楽", account: "PayPay", date: "2026-04-19", memo: "映画・カフェ" },
  { id: "14", type: "expense", amount: 50000, category: "投資", account: "楽天銀行", date: "2026-04-05", memo: "積立NISA" },
  { id: "15", type: "income", amount: 25000, category: "副業", account: "楽天銀行", date: "2026-04-20", memo: "フリーランス報酬" },
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

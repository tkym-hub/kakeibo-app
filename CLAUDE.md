# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test or lint commands are configured.

## Architecture

**Kakeibo-app** — 個人家計簿アプリ。Next.js 16 + React 19 + Supabase（PostgreSQL + Auth）。

### Routing (`src/app/`)

| Route | Purpose |
|---|---|
| `/` | Dashboard: monthly summary, savings rate, category pie chart, recent transactions |
| `/add` | Transaction entry form |
| `/transactions` | Transaction list with filter/edit/delete |
| `/monthly` | Monthly detail: income/fixed/variable/investment breakdown |
| `/settings` | Category, account, recurring template management |
| `/login` | Email/password auth |
| `/auth/callback` | Supabase OAuth callback |

### Auth & Middleware

- `src/proxy.ts` — Supabase session management middleware (Next.js 16 の `proxy.ts`、`middleware.ts` ではない)
- `src/lib/supabase.ts` — ブラウザ用クライアント（シングルトン）
- `src/lib/supabase-server.ts` — サーバーサイドクライアント（`cookies()` 使用）
- 未認証ユーザーは `/login` にリダイレクト、認証済みユーザーは `/login` から `/` にリダイレクト

### Data Layer (`src/lib/data/index.ts`)

全データ取得はここに集約。主な関数:
- `getCategories()` / `getAccounts()` / `getTransactions(month?)` / `getTemplates()`
- `formatCurrency()` / `formatDate()` / `groupTransactionsByDate()`
- カテゴリアイコンは静的マッピングでクライアントサイドに付与

### Database Schema（Supabase, RLS enabled）

- **accounts** — kind: `bank | cash | credit_card | e_money`、opening_balance + 累積取引でリアルタイム残高計算
- **categories** — type: `income | expense | transfer`、`is_fixed` で固定費/変動費を区別
- **transactions** — amount は常に正数（方向は type で管理）、transfer は `transfer_pair_id` でペアリング
- **recurring_templates** — 月次固定費の自動入力テンプレート

### Key Libraries

- **UI**: Radix UI primitives + Tailwind CSS v4 + shadcn/ui パターン (`src/components/ui/`)
- **Charts**: recharts（カテゴリ別円グラフ）
- **Icons**: lucide-react
- **Themes**: next-themes

### Path Alias

`@/*` → `src/*`

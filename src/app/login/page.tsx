"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

type Mode = "login" | "signup"

// 開発用テストログイン。NODE_ENV はビルド時に畳まれるため、
// 本番ビルド（Vercelのプレビューを含む）ではこのブロックごと残らない。
const DEV_LOGIN =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL &&
  process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD
    ? {
        email: process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL,
        password: process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD,
      }
    : null

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError("メールアドレスまたはパスワードが正しくありません")
      } else {
        router.push("/")
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage("確認メールを送信しました。メールのリンクをクリックしてログインしてください。")
      }
    }

    setLoading(false)
  }

  async function handleDevLogin() {
    if (!DEV_LOGIN) return
    setError(null)
    setMessage(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(DEV_LOGIN)
    if (error) {
      setError(`テストログインに失敗しました: ${error.message}`)
    } else {
      router.push("/")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif italic text-3xl text-foreground">Okane</h1>
          <p className="mt-1 text-sm text-muted-foreground">シンプルな収支管理</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-6">
            {mode === "login" ? "ログイン" : "アカウント作成"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="6文字以上"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {message && (
              <p className="text-sm text-primary">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウントを作成"}
            </button>
          </form>

          {DEV_LOGIN && (
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={loading}
              className="mt-4 w-full rounded-xl border border-dashed border-border py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border-strong disabled:opacity-50 transition-colors"
            >
              テストログイン（開発用）
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setError(null)
                setMessage(null)
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "login"
                ? "アカウントをお持ちでない方はこちら"
                : "すでにアカウントをお持ちの方はこちら"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

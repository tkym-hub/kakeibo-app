"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/add", label: "明細追加" },
  { href: "/transactions", label: "明細一覧" },
  { href: "/monthly", label: "月次詳細" },
  { href: "/settings", label: "設定" },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="flex h-16 items-center justify-between px-5 md:px-14">
      <Link href="/" className="font-serif-jp text-base font-medium tracking-[0.06em] text-foreground">
        家計簿
      </Link>
      <div className="hidden items-center gap-[30px] text-[13px] md:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors",
                isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="ml-3.5 text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
        >
          ログアウト
        </button>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-muted-foreground/80 transition-colors hover:text-foreground md:hidden"
      >
        ログアウト
      </button>
    </nav>
  )
}

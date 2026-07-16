"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/add", label: "Add Entry" },
  { href: "/transactions", label: "History" },
  { href: "/monthly", label: "Monthly" },
  { href: "/settings", label: "Settings" },
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
      <Link href="/" className="font-serif italic text-lg tracking-[0.04em] text-foreground">
        Okane
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
          Log out
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

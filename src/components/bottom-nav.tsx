"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Plus, List, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "History", icon: List },
  { href: "/add", label: "Add", icon: Plus, isMain: true },
  { href: "/monthly", label: "Monthly", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:rounded-full md:border md:border-border/60 md:shadow-lg">
      <div className="flex items-center justify-around px-1 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:gap-1 md:px-3 md:py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-6 md:mt-0"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:h-11 md:w-11">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[52px] px-3 py-1.5 rounded-2xl transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

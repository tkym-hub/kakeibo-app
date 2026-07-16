"use client"

import { BottomNav } from "./bottom-nav"
import { TopNav } from "./top-nav"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pb-28 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  )
}

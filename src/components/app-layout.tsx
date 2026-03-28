"use client"

import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className="pb-28 md:pb-0 md:pl-60">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}

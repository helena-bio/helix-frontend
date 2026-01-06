"use client"

import { useState } from "react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card h-14 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">Helix Insight</h1>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-foreground hover:text-primary transition-colors">
              Dashboard
            </a>
            <a href="/analysis" className="text-foreground hover:text-primary transition-colors">
              Analysis
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

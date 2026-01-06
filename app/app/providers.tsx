"use client"

import { QueryProvider } from "@/providers/QueryProvider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        {children}
      </QueryProvider>
      <Toaster />
    </ThemeProvider>
  )
}

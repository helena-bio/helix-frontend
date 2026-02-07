import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Helena Bioinformatics | Advancing Clinical Genomics Through AI",
  description: "Helena Bioinformatics develops AI-powered tools for clinical genetics laboratories, including Helix Insight for automated variant interpretation.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

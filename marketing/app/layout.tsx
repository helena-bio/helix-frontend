import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'
import { DemoModalProvider, AuthProvider, LoginModalProvider } from '@/contexts'
import { RequestDemoModal, LoginModal } from '@/components'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Helix Insight | AI-Powered Genetic Variant Analysis",
  description: "Transform genetic variant analysis from days to hours with AI-powered VUS prioritization and automated clinical interpretation.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased h-dvh overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <DemoModalProvider>
              <LoginModalProvider>
                {children}
                <RequestDemoModal />
                <LoginModal />
              </LoginModalProvider>
            </DemoModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { DemoModalProvider } from '@/contexts'
import { RequestDemoModal } from '@/components'

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <DemoModalProvider>
          {children}
          <RequestDemoModal />
        </DemoModalProvider>
      </body>
    </html>
  )
}

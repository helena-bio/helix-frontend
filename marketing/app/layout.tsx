import type { Metadata } from "next"
import '../styles/globals.css'

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
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

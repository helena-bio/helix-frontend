import type { Metadata } from "next"
import '@helix/shared/styles/globals.css'
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Helix Insight | AI-Powered Genetic Variant Analysis",
  description: "Transform genetic variant analysis from days to hours with AI-powered VUS prioritization and automated clinical interpretation.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

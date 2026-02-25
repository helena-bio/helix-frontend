import type { Metadata } from "next"
import '@helix/shared/styles/globals.css'
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Helena | AI-Powered Genetic Variant Interpretation",
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

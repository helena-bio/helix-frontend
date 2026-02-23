import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://helena.bio'),
  title: {
    default: 'Helena Bioinformatics -- AI-Powered Clinical Genomics Software',
    template: '%s | Helena Bioinformatics',
  },
  description: 'Bulgarian deep-tech company developing Helix Insight -- an AI platform for automated clinical genomic variant interpretation at whole-genome scale. EU-hosted, GDPR-native.',
  keywords: [
    'clinical genomics software',
    'AI genomic variant interpretation',
    'bioinformatics company Bulgaria',
    'ACMG variant classification',
    'clinical genetics AI',
    'genomic data analysis',
    'EU genomics software',
    'Helix Insight',
  ],
  authors: [{ name: 'Helena Bioinformatics' }],
  creator: 'Helena Bioinformatics',
  publisher: 'Helena Bioinformatics',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://helena.bio',
    siteName: 'Helena Bioinformatics',
    title: 'Helena Bioinformatics -- AI-Powered Clinical Genomics Software',
    description: 'Bulgarian deep-tech company developing Helix Insight -- an AI platform for automated clinical genomic variant interpretation at whole-genome scale.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helena Bioinformatics -- AI-Powered Clinical Genomics',
    description: 'Deep-tech company developing AI-powered clinical genomic variant interpretation. EU-hosted, GDPR-native.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://helena.bio',
  },
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

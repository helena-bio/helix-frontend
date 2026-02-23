import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'
import { DemoModalProvider, AuthProvider, LoginModalProvider } from '@/contexts'
import { RequestDemoModal, LoginModal } from '@/components'
import { GoogleAnalytics } from '@/components/seo'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://helixinsight.bio'),
  title: {
    default: 'Helix Insight -- AI-Powered Variant Interpretation for Clinical Genetics Laboratories',
    template: '%s | Helix Insight',
  },
  description: 'Automated ACMG classification, phenotype matching, and clinical reporting. From VCF upload to diagnostic insight in minutes. EU-hosted, GDPR-compliant. Free to start.',
  keywords: [
    'variant interpretation software',
    'ACMG classification tool',
    'VCF analysis software',
    'VUS classification',
    'clinical genetics software',
    'phenotype matching',
    'genetic variant analysis',
    'GDPR compliant genomics',
  ],
  authors: [{ name: 'Helena Bioinformatics' }],
  creator: 'Helena Bioinformatics',
  publisher: 'Helena Bioinformatics',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://helixinsight.bio',
    siteName: 'Helix Insight',
    title: 'Helix Insight -- AI-Powered Variant Interpretation for Clinical Genetics Laboratories',
    description: 'Automated ACMG classification, phenotype matching, and clinical reporting. From VCF upload to diagnostic insight in minutes. EU-hosted, GDPR-compliant.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helix Insight -- AI-Powered Variant Interpretation',
    description: 'Automated ACMG classification, phenotype matching, and clinical reporting. EU-hosted, GDPR-compliant. Free to start.',
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
    canonical: 'https://helixinsight.bio',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <GoogleAnalytics />
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

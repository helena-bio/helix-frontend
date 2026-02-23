import type { Metadata } from 'next'
import { Header } from '@/components'
import { DocsSidebar, DocsPagination, DocsHighlighter } from '@/components/docs'
import { DocsBreadcrumbJsonLd } from '@/components/seo'

export const metadata: Metadata = {
  title: 'Documentation -- Variant Interpretation Pipeline | Helix Insight',
  description: 'Complete technical documentation for Helix Insight: ACMG classification, computational predictors, reference databases, phenotype matching, screening, and AI clinical assistant.',
  alternates: {
    canonical: 'https://helixinsight.bio/docs',
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex flex-col">
      <DocsBreadcrumbJsonLd />
      <Header />
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <DocsSidebar />
        <main className="flex-1 overflow-y-auto">
          <DocsHighlighter>
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              {children}
              <DocsPagination />
            </div>
          </DocsHighlighter>
        </main>
      </div>
    </div>
  )
}

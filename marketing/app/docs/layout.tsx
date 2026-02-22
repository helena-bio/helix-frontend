import { Header, Footer } from '@/components'
import { DocsSidebar } from '@/components/docs'

export const metadata = {
  title: 'Documentation | Helix Insight',
  description: 'Complete documentation for Helix Insight -- AI-powered genetic variant analysis platform. Classification methodology, reference databases, phenotype matching, and clinical workflows.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex flex-col">
      <Header />
      <div className="flex-1 min-h-0 flex">
        <DocsSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  )
}

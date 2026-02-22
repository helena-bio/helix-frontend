import { Header, Footer } from '@/components'
import { DocsSidebar } from '@/components/docs'

export const metadata = {
  title: 'Documentation | Helix Insight',
  description: 'Complete documentation for Helix Insight -- AI-powered genetic variant analysis platform. Classification methodology, reference databases, phenotype matching, and clinical workflows.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar -- desktop only */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 pt-6">
            <p className="text-sm font-semibold text-foreground mb-4 px-3">Documentation</p>
            <DocsSidebar />
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  )
}

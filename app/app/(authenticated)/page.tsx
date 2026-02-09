/**
 * Dashboard Page
 * Main home view after authentication
 * Shows user's cases and quick actions
 */
'use client'

import { useRouter } from 'next/navigation'
import { Plus, Microscope, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useCases } from '@/hooks/queries/use-cases'
import { cn } from '@helix/shared/lib/utils'
import type { AnalysisSession } from '@/types/variant.types'

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 text-sm text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 text-sm text-orange-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processing
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {status}
        </span>
      )
  }
}

function getCaseDisplayName(session: AnalysisSession): string {
  if (session.case_label) return session.case_label
  if (session.original_filename) {
    return session.original_filename.replace(/\.vcf(\.gz)?$/i, '')
  }
  return session.id.slice(0, 8)
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data, isLoading } = useCases()

  const cases = data?.sessions ?? []

  const handleNewCase = () => {
    router.push('/upload')
  }

  const handleCaseClick = (session: AnalysisSession) => {
    if (session.status !== 'completed') return
    router.push(`/analysis?session=${session.id}`)
  }

  return (
    <div className="flex flex-col min-h-full p-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.full_name ? `Welcome, ${user.full_name}` : 'Dashboard'}
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Manage your variant analysis cases
          </p>
        </div>

        {/* New Case CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Microscope className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold">Start a new analysis</h2>
                  <p className="text-md text-muted-foreground">
                    Upload a VCF file to begin variant interpretation
                  </p>
                </div>
              </div>
              <Button onClick={handleNewCase}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-base">New Case</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Cases</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-base text-muted-foreground">
                  No cases yet. Start by uploading a VCF file.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {cases.map((session) => {
                const isCompleted = session.status === 'completed'

                return (
                  <Card
                    key={session.id}
                    className={cn(
                      "transition-colors",
                      isCompleted && "hover:bg-accent cursor-pointer"
                    )}
                    onClick={() => handleCaseClick(session)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium truncate">
                            {getCaseDisplayName(session)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatRelativeDate(session.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={session.status} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

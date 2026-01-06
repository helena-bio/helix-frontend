/**
 * Dashboard Page
 * Main home view after authentication
 */

'use client'

import { useAnalysis } from '@/contexts/AnalysisContext'
import { useSessions } from '@/hooks/queries/use-variant-analysis-queries'

export default function DashboardPage() {
  const { setSelectedModule, currentSessionId } = useAnalysis()
  const { data: sessions, isLoading } = useSessions()

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start your first analysis by uploading a genetic variant file (VCF).
        </p>

        {/* Sessions list - placeholder */}
        {isLoading && (
          <div className="p-8 border border-border rounded-lg">
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        )}

        {!isLoading && sessions && sessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedModule('analysis')}
                >
                  <p className="font-medium">{session.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {session.status} • {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="p-12 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-muted-foreground">No sessions yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Variant Analysis" to start your first analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

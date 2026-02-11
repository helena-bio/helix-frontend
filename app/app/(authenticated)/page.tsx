/**
 * Dashboard Page
 * Expandable case cards with lazy-loaded clinical profile.
 * Card layout aligned 1:1 with PhenotypeMatchingView GeneSection.
 */
'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Microscope,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Sparkles,
  User,
  Shield,
  FileText,
  Dna,
  BookOpen,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useCases } from '@/hooks/queries/use-cases'
import { cn } from '@helix/shared/lib/utils'
import type { AnalysisSession } from '@/types/variant.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.helixinsight.bio'

// ============================================================================
// TYPES
// ============================================================================

interface ClinicalProfileData {
  session_id: string
  saved_at?: number
  demographics?: {
    sex?: string
    age_group?: string
    ethnicity?: string
  }
  modules?: {
    enable_screening?: boolean
    enable_phenotype_matching?: boolean
  }
  reproductive?: {
    is_pregnant?: boolean
    family_planning?: boolean
  }
  consent?: {
    secondary_findings?: boolean
    carrier_results?: boolean
    pharmacogenomics?: boolean
  }
  phenotype?: {
    hpo_terms?: Array<{ hpo_id: string; name: string }>
  }
}

// ============================================================================
// HELPERS
// ============================================================================

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

function getCaseDisplayName(session: AnalysisSession): string {
  if (session.case_label) return session.case_label
  if (session.original_filename) {
    return session.original_filename.replace(/\.vcf(\.gz)?$/i, '')
  }
  return session.id.slice(0, 8)
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  completed: { color: 'bg-green-100 text-green-900 border-green-300', icon: CheckCircle2 },
  processing: { color: 'bg-orange-100 text-orange-900 border-orange-300', icon: Loader2 },
  failed: { color: 'bg-red-100 text-red-900 border-red-300', icon: AlertCircle },
  pending: { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: Clock },
  validated: { color: 'bg-blue-100 text-blue-900 border-blue-300', icon: FileText },
}

// ============================================================================
// CASE CARD - aligned 1:1 with PhenotypeMatchingView GeneSection
// ============================================================================

interface CaseCardProps {
  session: AnalysisSession
  rank: number
  profileCache: React.MutableRefObject<Map<string, ClinicalProfileData>>
  onNavigate: (session: AnalysisSession) => void
}

function CaseCard({ session, rank, profileCache, onNavigate }: CaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profile, setProfile] = useState<ClinicalProfileData | null>(null)

  const isCompleted = session.status === 'completed'
  const config = statusConfig[session.status] || statusConfig.pending
  const StatusIcon = config.icon

  const handleExpand = useCallback(async () => {
    if (!isCompleted) return

    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    // Check cache first
    const cached = profileCache.current.get(session.id)
    if (cached) {
      setProfile(cached)
      return
    }

    // Fetch clinical profile
    setIsLoadingProfile(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/sessions/${session.id}/clinical-profile`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const text = await res.text()
        const lines = text.trim().split('\n')

        // Parse NDJSON - merge all lines into single object
        let merged: ClinicalProfileData = { session_id: session.id }
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.type === 'metadata') {
              merged.session_id = parsed.session_id
              merged.saved_at = parsed.saved_at
            } else if (parsed.type === 'demographics') {
              merged.demographics = parsed.data
            } else if (parsed.type === 'modules') {
              merged.modules = parsed.data
            } else if (parsed.type === 'reproductive') {
              merged.reproductive = parsed.data
            } else if (parsed.type === 'consent') {
              merged.consent = parsed.data
            } else if (parsed.type === 'phenotype') {
              merged.phenotype = parsed.data
            }
          } catch { /* skip malformed lines */ }
        }

        profileCache.current.set(session.id, merged)
        setProfile(merged)
      }
    } catch (err) {
      console.error(`Failed to load profile for ${session.id}:`, err)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [isExpanded, isCompleted, session.id, profileCache])

  return (
    <Card className="gap-0">
      <CardHeader
        className={cn(
          "py-3 transition-colors",
          isCompleted && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank + Name + Status + Genome Build */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8">#{rank}</span>
            <span className="text-lg font-semibold">{getCaseDisplayName(session)}</span>
            <Badge variant="outline" className={`text-sm ${config.color}`}>
              <StatusIcon className={cn("h-3 w-3 mr-1", session.status === 'processing' && "animate-spin")} />
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
            {session.genome_build && (
              <Badge variant="secondary" className="text-sm">
                {session.genome_build}
              </Badge>
            )}
          </div>

          {/* Right: Date + Chevron */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatRelativeDate(session.created_at)}
            </span>
            {isCompleted && (
              isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Loading state */}
          {isLoadingProfile && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading clinical profile...</span>
            </div>
          )}

          {/* Profile loaded */}
          {!isLoadingProfile && profile && (
            <div className="space-y-4">
              {/* Demographics */}
              {profile.demographics && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">Demographics</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-md">
                    {profile.demographics.sex && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sex</span>
                        <span className="capitalize">{profile.demographics.sex}</span>
                      </div>
                    )}
                    {profile.demographics.age_group && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age Group</span>
                        <span className="capitalize">{profile.demographics.age_group}</span>
                      </div>
                    )}
                    {profile.demographics.ethnicity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ethnicity</span>
                        <span className="capitalize">{profile.demographics.ethnicity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HPO Terms */}
              {profile.phenotype?.hpo_terms && profile.phenotype.hpo_terms.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-base font-semibold">Phenotypes</p>
                    <Badge variant="secondary" className="text-xs">
                      {profile.phenotype.hpo_terms.length} term{profile.phenotype.hpo_terms.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.phenotype.hpo_terms.map((term) => (
                      <Badge
                        key={term.hpo_id}
                        variant="secondary"
                        className="px-3 py-1.5 bg-primary/10 text-primary text-sm"
                      >
                        {term.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Modules */}
              {profile.modules && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">Active Modules</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm bg-blue-50 text-blue-900 border-blue-200">
                      <Dna className="h-3 w-3 mr-1" />
                      Variant Analysis
                    </Badge>
                    {profile.modules.enable_screening && (
                      <Badge variant="outline" className="text-sm bg-orange-50 text-orange-900 border-orange-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Clinical Screening
                      </Badge>
                    )}
                    {profile.modules.enable_phenotype_matching && (
                      <Badge variant="outline" className="text-sm bg-purple-50 text-purple-900 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Phenotype Matching
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-sm bg-green-50 text-green-900 border-green-200">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Literature Analysis
                    </Badge>
                  </div>
                </div>
              )}

              {/* Consent */}
              {profile.consent && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">Consent</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.consent.secondary_findings && (
                      <Badge variant="outline" className="text-xs">Secondary Findings</Badge>
                    )}
                    {profile.consent.carrier_results && (
                      <Badge variant="outline" className="text-xs">Carrier Results</Badge>
                    )}
                    {profile.consent.pharmacogenomics && (
                      <Badge variant="outline" className="text-xs">Pharmacogenomics</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate(session)
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Case
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate(session)
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Report
                </Button>
              </div>
            </div>
          )}

          {/* No profile */}
          {!isLoadingProfile && !profile && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-2">
                No clinical profile saved for this case.
              </p>
              <div className="pt-2 border-t">
                <Button
                  variant="default"
                  size="sm"
                  className="text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate(session)
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Case
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { skipToAnalysis } = useJourney()
  const { data, isLoading } = useCases()

  const cases = data?.sessions ?? []
  const [searchQuery, setSearchQuery] = useState('')
  const profileCache = useRef<Map<string, ClinicalProfileData>>(new Map())

  const filteredCases = cases.filter((session) => {
    if (!searchQuery) return true
    const name = getCaseDisplayName(session).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const handleNewCase = () => {
    router.push('/upload')
  }

  const handleNavigate = useCallback((session: AnalysisSession) => {
    if (session.status !== 'completed') return
    skipToAnalysis()
    router.push(`/analysis?session=${session.id}`)
  }, [router, skipToAnalysis])

  return (
    <div className="flex flex-col min-h-full p-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Microscope className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {user?.full_name ? `Welcome, ${user.full_name}` : 'Dashboard'}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage your variant analysis cases
            </p>
          </div>
          <Button onClick={handleNewCase}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-base">New Case</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-base bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredCases.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Microscope className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">
                {searchQuery ? 'No matching cases' : 'No cases yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'Start by uploading a VCF file.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Case Cards */}
        {!isLoading && filteredCases.length > 0 && (
          <div className="space-y-3">
            <p className="text-md text-muted-foreground">
              {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
              {searchQuery && ' matching filter'}
            </p>
            {filteredCases.map((session, idx) => (
              <CaseCard
                key={session.id}
                session={session}
                rank={idx + 1}
                profileCache={profileCache}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Dashboard Page
 * Expandable case cards with lazy-loaded clinical profile.
 * Card layout aligned 1:1 with PhenotypeMatchingView GeneSection.
 *
 * CACHING:
 * - Memory LRU (Map ref) for instant re-expand within session
 * - IndexedDB 'clinical-profiles' store for cross-session persistence (7d TTL)
 */
'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
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
  Users,
  Shield,
  FileText,
  Dna,
  BookOpen,
} from 'lucide-react'
import { Button } from '@helix/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@helix/shared/components/ui/dropdown-menu'
import { downloadClinicalReport, type ReportFormat } from '@/lib/utils/download-report'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@helix/shared/components/ui/tooltip'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useJourney } from '@/contexts/JourneyContext'
import { useCases } from '@/hooks/queries/use-cases'
import { cn } from '@helix/shared/lib/utils'
import { getCached, setCache } from '@/lib/cache/session-disk-cache'
import { get } from '@/lib/api/client'
import type { AnalysisSession } from '@/types/variant.types'
import { getDashboardGreeting } from '@/lib/constants/dashboard-greetings'
import { UserAvatar } from '@/components/ui/UserAvatar'

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

interface Finding {
  gene_symbol: string
  hgvs_cdna: string | null
  hgvs_protein: string | null
  acmg_class: string
  consequence: string | null
  gnomad_af: number | null
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

function parseNdjsonProfile(text: string, sessionId: string): ClinicalProfileData {
  const lines = text.trim().split('\n')
  const merged: ClinicalProfileData = { session_id: sessionId }
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
  return merged
}

function formatConsequence(consequence: string | null): string {
  if (!consequence) return '-'
  return consequence
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
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
  showOwner: boolean
  memoryCache: React.MutableRefObject<Map<string, ClinicalProfileData>>
  onNavigate: (session: AnalysisSession) => void
}

function CaseCard({ session, showOwner, memoryCache, onNavigate }: CaseCardProps) {
  const { avatarVersion } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profile, setProfile] = useState<ClinicalProfileData | null>(null)
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [isLoadingFindings, setIsLoadingFindings] = useState(false)

  const isCompleted = session.status === 'completed'
  const hasFindings = session.pathogenic_count > 0 || session.likely_pathogenic_count > 0
  const config = statusConfig[session.status] || statusConfig.pending
  const StatusIcon = config.icon

  const handleExpand = useCallback(async () => {
    if (!isCompleted) return

    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    // Expand immediately with loading spinner
    setIsExpanded(true)
    setIsLoadingProfile(true)

    // Load profile: memory -> IndexedDB -> network
    if (!profile) {
      const memoryCached = memoryCache.current.get(session.id)
      if (memoryCached) {
        setProfile(memoryCached)
      } else {
        const diskCached = await getCached<ClinicalProfileData>('clinical-profiles', session.id)
        if (diskCached) {
          memoryCache.current.set(session.id, diskCached)
          setProfile(diskCached)
        } else {
          try {
            const res = await fetch(
              `${API_BASE_URL}/sessions/${session.id}/clinical-profile`,
              { credentials: 'include' }
            )
            if (res.ok) {
              const text = await res.text()
              const parsed = parseNdjsonProfile(text, session.id)
              memoryCache.current.set(session.id, parsed)
              setCache('clinical-profiles', session.id, parsed).catch(() => {})
              setProfile(parsed)
            }
          } catch (err) {
            console.error(`Failed to load profile for ${session.id}:`, err)
          }
        }
      }
    }

    // Load findings
    if (hasFindings && !findings) {
      try {
        const data = await get<{ findings: Finding[] }>(`/sessions/${session.id}/findings`)
        setFindings(data.findings || [])
      } catch (err) {
        console.error(`Failed to load findings for ${session.id}:`, err)
      }
    }

    setIsLoadingProfile(false)
  }, [isExpanded, isCompleted, session.id, memoryCache, hasFindings, findings, profile])

  const handleDownloadReport = useCallback(async (sessionId: string, format: ReportFormat) => {
    try {
      let interpretationContent: string | undefined

      // Layer 1: IndexedDB cache
      try {
        const cached = await getCached<{ content: string }>('clinical-interpretations', sessionId)
        if (cached?.content) {
          interpretationContent = cached.content
        }
      } catch { /* IndexedDB unavailable */ }

      // Layer 2: Backend fetch
      if (!interpretationContent) {
        const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'
        const res = await fetch(`${AI_URL}/api/v1/analysis/interpret/${sessionId}`)
        if (!res.ok) throw new Error('No interpretation')
        const data = await res.json()
        interpretationContent = data.content
        // Cache for next time
        setCache('clinical-interpretations', sessionId, {
          content: data.content,
          metadata: {
            level: data.level ?? 0,
            level_label: data.level_label ?? '',
            modules_used: data.modules_used ?? [],
            content_length: data.content_length ?? 0,
          },
        }).catch(() => {})
      }

      if (interpretationContent === undefined) throw new Error("No content")
      await downloadClinicalReport(interpretationContent, format, sessionId)
      toast.success(`Report downloaded as ${format === 'md' ? 'Markdown' : format.toUpperCase()}`)
    } catch {
      toast.error('No clinical report available for this case')
    }
  }, [])

  return (
    <Card className="gap-0 py-0">
      <CardHeader
        className={cn(
          "py-3 transition-colors",
          isCompleted && "cursor-pointer hover:bg-accent/50"
        )}
        onClick={handleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="shrink-0">
                    <UserAvatar fullName={session.owner_name || "U"} userId={session.user_id} size="md" version={avatarVersion} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">{session.owner_name || "Unknown"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-base font-medium truncate">{getCaseDisplayName(session)}</span>
            {session.status !== 'completed' && (
              <Badge variant="outline" className={`text-sm shrink-0 ${config.color}`}>
                <StatusIcon className={cn("h-3 w-3 mr-1", session.status === 'processing' && "animate-spin")} />
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            )}
          </div>
          {/* Right: Badges + Date + Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && hasFindings && (
              <div className="flex items-center gap-1">
                {session.pathogenic_count > 0 && (
                  <Badge variant="outline" className="text-sm bg-red-100 text-red-900 border-red-300">
                    {session.pathogenic_count} P
                  </Badge>
                )}
                {session.likely_pathogenic_count > 0 && (
                  <Badge variant="outline" className="text-sm bg-orange-100 text-orange-900 border-orange-300">
                    {session.likely_pathogenic_count} LP
                  </Badge>
                )}
              </div>
            )}
            <span className="text-md text-muted-foreground w-16 text-right">
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
              <span className="text-md text-muted-foreground">Loading clinical profile...</span>
            </div>
          )}

          {/* Profile loaded */}
          {!isLoadingProfile && profile && (
            <div className="space-y-4">
              {/* P/LP Findings Table */}
              {hasFindings && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Dna className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">Pathogenic Findings</p>
                    <Badge variant="secondary" className="text-xs">
                      {(session.pathogenic_count || 0) + (session.likely_pathogenic_count || 0)} variant{(session.pathogenic_count || 0) + (session.likely_pathogenic_count || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {findings && findings.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left text-md text-muted-foreground font-medium px-3 py-2">Gene</th>
                            <th className="text-left text-md text-muted-foreground font-medium px-3 py-2">Variant</th>
                            <th className="text-left text-md text-muted-foreground font-medium px-3 py-2">Class</th>
                            <th className="text-left text-md text-muted-foreground font-medium px-3 py-2">Consequence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {findings.map((f, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-1.5 font-medium">{f.gene_symbol || '-'}</td>
                              <td className="px-3 py-1.5 text-md">
                                {f.hgvs_cdna ? f.hgvs_cdna.replace(/^ENST[^:]+:/, '') : '-'}
                                {f.hgvs_protein && (
                                  <span className="text-muted-foreground ml-1">
                                    {(() => { const p = f.hgvs_protein.replace(/^ENSP[^:]+:/, ""); return `(${p.length > 20 ? p.slice(0, 20) + "..." : p})`; })()}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-sm",
                                    f.acmg_class === 'Pathogenic'
                                      ? "bg-red-100 text-red-900 border-red-300"
                                      : "bg-orange-100 text-orange-900 border-orange-300"
                                  )}
                                >
                                  {f.acmg_class === 'Pathogenic' ? 'P' : 'LP'}
                                </Badge>
                              </td>
                              <td className="px-3 py-1.5 text-md text-muted-foreground">
                                {formatConsequence(f.consequence)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Demographics */}
              {profile.demographics && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-semibold">Demographics</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-base">
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
                      <Badge variant="outline" className="text-sm">Secondary Findings</Badge>
                    )}
                    {profile.consent.carrier_results && (
                      <Badge variant="outline" className="text-sm">Carrier Results</Badge>
                    )}
                    {profile.consent.pharmacogenomics && (
                      <Badge variant="outline" className="text-sm">Pharmacogenomics</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 pb-3 border-t flex items-center gap-2">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Report
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40" onClick={(e) => e.stopPropagation()}>
                    {(['pdf', 'docx', 'md'] as ReportFormat[]).map((fmt) => (
                      <DropdownMenuItem
                        key={fmt}
                        className="cursor-pointer text-md"
                        onClick={() => handleDownloadReport(session.id, fmt)}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        {fmt === 'md' ? 'Markdown' : fmt.toUpperCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
  const { user, avatarVersion } = useAuth()
  const { skipToAnalysis } = useJourney()

  const [showAll, setShowAll] = useState(false)
  const { data, isLoading } = useCases(!showAll)

  const cases = data?.sessions ?? []
  const [searchQuery, setSearchQuery] = useState('')
  const memoryCache = useRef<Map<string, ClinicalProfileData>>(new Map())
  const greeting = useMemo(() => getDashboardGreeting(user?.full_name), [user?.full_name])

  const filteredCases = cases.filter((session) => {
    if (!searchQuery) return true
    const name = getCaseDisplayName(session).toLowerCase()
    const owner = (session.owner_name || '').toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || owner.includes(searchQuery.toLowerCase())
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
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting.title}
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {greeting.subtitle}
          </p>
        </div>

        {/* Mine/All toggle + Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 shrink-0">
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-md transition-colors",
                !showAll ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowAll(false)}
            >
              <User className="h-4 w-4" />
              Mine
            </button>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-md transition-colors",
                showAll ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowAll(true)}
            >
              <Users className="h-4 w-4" />
              Team
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-base bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
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
              <Microscope className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">
                {searchQuery ? 'No matching cases' : showAll ? 'No cases in team' : 'No cases yet'}
              </p>
              <p className="text-md text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'Start by uploading a VCF file.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Case Cards */}
        {!isLoading && filteredCases.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base text-muted-foreground">
                {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
                {searchQuery && ' matching filter'}
                {showAll && ' across team'}
              </p>
              <Button onClick={handleNewCase}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-base">New Case</span>
              </Button>
            </div>
            {filteredCases.map((session, idx) => (
              <CaseCard
                key={session.id}
                session={session}
                showOwner={showAll}
                memoryCache={memoryCache}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

/**
 * Shared Variant Styling Helpers
 * Used by VariantAnalysisView, PhenotypeMatchingView, and VariantDetailPanel
 */

import { Badge } from '@/components/ui/badge'

// ============================================================================
// STYLING HELPERS
// ============================================================================

export const getACMGColor = (acmg: string | null | undefined) => {
  if (!acmg) return 'bg-gray-100 text-gray-600 border-gray-300'
  const acmgLower = acmg.toLowerCase()
  if (acmgLower === 'pathogenic') return 'bg-red-100 text-red-900 border-red-300'
  if (acmgLower === 'likely pathogenic') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (acmgLower.includes('uncertain') || acmgLower === 'vus') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (acmgLower === 'likely benign') return 'bg-blue-100 text-blue-900 border-blue-300'
  if (acmgLower === 'benign') return 'bg-green-100 text-green-900 border-green-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

export const getImpactColor = (impact: string | null | undefined) => {
  if (!impact) return 'bg-gray-100 text-gray-600 border-gray-300'
  const impactUpper = impact.toUpperCase()
  if (impactUpper === 'HIGH') return 'bg-red-100 text-red-900 border-red-300'
  if (impactUpper === 'MODERATE') return 'bg-orange-100 text-orange-900 border-orange-300'
  if (impactUpper === 'LOW') return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

export const getTierColor = (tier: string | number | null | undefined) => {
  if (!tier) return 'bg-gray-100 text-gray-600 border-gray-300'
  const tierStr = String(tier).toLowerCase()
  // IF must be checked BEFORE tier numbers to avoid false match on "incidental finding" containing no digits
  if (tierStr.startsWith('if') || tierStr.includes('incidental')) return 'bg-purple-100 text-purple-900 border-purple-300'
  if (tierStr.includes('1')) return 'bg-red-100 text-red-900 border-red-300'
  if (tierStr.includes('2') || tierStr.includes('potentially')) return 'bg-orange-100 text-orange-900 border-orange-300'
  if (tierStr.includes('3') || tierStr.includes('uncertain')) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

export const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-green-100 text-green-900 border-green-300'
  if (score >= 50) return 'bg-blue-100 text-blue-900 border-blue-300'
  if (score >= 30) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

export const getZygosityBadge = (genotype: string | null | undefined) => {
  if (!genotype) return { label: '-', color: 'bg-gray-100 text-gray-600 border-gray-300' }
  if (genotype === '0/1' || genotype === '1/0' || genotype === '0|1' || genotype === '1|0' || genotype === 'het') {
    return { label: 'Het', color: 'bg-blue-100 text-blue-900 border-blue-300' }
  }
  if (genotype === '1/1' || genotype === '1|1' || genotype === 'hom') {
    return { label: 'Hom', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  }
  if (genotype === '1' || genotype === '1/.' || genotype === '.|1' || genotype === 'hemi') {
    return { label: 'Hemi', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
  }
  return { label: genotype, color: 'bg-gray-100 text-gray-600 border-gray-300' }
}

// ============================================================================
// FORMATTERS
// ============================================================================

export const formatACMGDisplay = (acmg: string | null | undefined): string => {
  if (!acmg) return 'Unknown'
  if (acmg.toLowerCase().includes('uncertain')) return 'VUS'
  if (acmg.toLowerCase() === 'likely pathogenic') return 'LP'
  if (acmg.toLowerCase() === 'likely benign') return 'LB'
  if (acmg.toLowerCase() === 'pathogenic') return 'P'
  if (acmg.toLowerCase() === 'benign') return 'B'
  return acmg
}

export const formatTierDisplay = (tier: string | number | null | undefined): string => {
  if (!tier) return '-'
  const tierStr = String(tier).toLowerCase()
  // IF must be checked BEFORE tier numbers
  if (tierStr.startsWith('if') || tierStr.includes('incidental')) return 'IF'
  if (tierStr.includes('1')) return 'T1'
  if (tierStr.includes('2') || tierStr.includes('potentially')) return 'T2'
  if (tierStr.includes('3') || tierStr.includes('uncertain')) return 'T3'
  if (tierStr.includes('4') || tierStr.includes('unlikely')) return 'T4'
  return `T${tier}`
}

/**
 * Format consequence string - remove _variant suffix and underscores
 * "splice_polypyrimidine_tract_variant" -> "Splice Polypyrimidine Tract"
 */
export const formatConsequence = (consequence: string): string => {
  return consequence
    .replace(/_variant$/i, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Parse consequence string into array
 * "splice_polypyrimidine_tract_variant,intron_variant" -> ["Splice Polypyrimidine Tract", "Intron"]
 */
export const parseConsequences = (consequence: string | null | undefined): string[] => {
  if (!consequence) return ['Unknown']
  return consequence.split(',').map(c => formatConsequence(c.trim())).filter(Boolean)
}

/**
 * Get color for consequence type based on impact level
 */
export const getConsequenceColor = (consequence: string): string => {
  const c = consequence.toLowerCase()

  // High impact (red)
  if (c.includes('frameshift') || c.includes('stop gained') || c.includes('stop lost') ||
      c.includes('start lost') || c.includes('splice donor') || c.includes('splice acceptor') ||
      c.includes('transcript ablation')) {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  // Moderate impact (orange)
  if (c.includes('missense') || c.includes('inframe') || c.includes('protein altering') ||
      c.includes('regulatory region') || c.includes('coding sequence')) {
    return 'bg-orange-50 text-orange-700 border-orange-200'
  }

  // Low impact (yellow)
  if (c.includes('synonymous') || c.includes('splice region') || c.includes('stop retained') ||
      c.includes('start retained') || c.includes('incomplete terminal')) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }

  // Modifier (gray)
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

// ============================================================================
// CONSEQUENCE BADGES COMPONENT
// ============================================================================

interface ConsequenceBadgesProps {
  consequence: string | null | undefined
  maxBadges?: number
  className?: string
}

export function ConsequenceBadges({ consequence, maxBadges = 3, className = '' }: ConsequenceBadgesProps) {
  const consequences = parseConsequences(consequence)
  const displayConsequences = consequences.slice(0, maxBadges)
  const remaining = consequences.length - maxBadges

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayConsequences.map((c, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className={`text-tiny ${getConsequenceColor(c)}`}
        >
          {c}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-tiny bg-gray-50 text-gray-500 border-gray-200">
          +{remaining} more
        </Badge>
      )}
    </div>
  )
}

// ============================================================================
// SEQUENCE TRUNCATION
// ============================================================================

/**
 * Truncate long DNA/protein sequences for display.
 * "AGTCACCAACTCTGGGTCCAGTGTGACCTCCAGT..." -> "AGTCACCAACTCTGGGTCC..."
 */
export const formatClinVarDisplay = (clinvar: string | null | undefined): string => {
  if (!clinvar) return '—'
  const c = clinvar.toLowerCase()
  if (c.includes('pathogenic/likely') || c === 'pathogenic/likely_pathogenic') return 'P/LP'
  if (c.includes('pathogenic') && !c.includes('likely')) return 'P'
  if (c.includes('likely pathogenic') || c.includes('likely_pathogenic')) return 'LP'
  if (c.includes('uncertain') || c.includes('vus')) return 'VUS'
  if (c.includes('likely benign') || c.includes('likely_benign')) return 'LB'
  if (c.includes('benign')) return 'B'
  return clinvar
}
export const truncateSequence = (seq: string | null | undefined, maxLen: number = 20): string => {
  if (!seq) return '-'
  if (seq.length <= maxLen) return seq
  return seq.slice(0, maxLen) + '...'
}

/**
 * Format allele display with truncation for long indels.
 * Short: "A/T" or "AC/A"
 * Long: "A/AGTCACCAACTCTG..." -> "A / AGTCACC..."
 */
export const formatAlleles = (ref: string | null | undefined, alt: string | null | undefined, maxLen: number = 20): string => {
  const r = ref || '-'
  const a = alt || '-'
  if (r.length + a.length <= maxLen + 3) return `${r}/${a}`
  return `${truncateSequence(r, maxLen)}/${truncateSequence(a, maxLen)}`
}

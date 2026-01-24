"use client"

/**
 * GnomADCard - Clinical-grade population frequency display
 * Shows allele frequency with intuitive visualization and ACMG context
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ExternalLink } from 'lucide-react'

interface GnomADCardProps {
  globalAF: number | null
  globalAC: number | null
  globalAN: number | null
  globalHom: number | null
  popmax: string | null
  popmaxAF: number | null
  rsid?: string | null
  chromosome?: string | null
  position?: number | null
  refAllele?: string | null
  altAllele?: string | null
}

const POPULATION_NAMES: Record<string, string> = {
  afr: 'African/African American',
  amr: 'Latino/Admixed American',
  asj: 'Ashkenazi Jewish',
  eas: 'East Asian',
  fin: 'Finnish',
  mid: 'Middle Eastern',
  nfe: 'Non-Finnish European',
  sas: 'South Asian',
  ami: 'Amish',
  oth: 'Other',
  remaining: 'Remaining',
}

function getRarityCategory(af: number): { label: string; color: string; bgColor: string } {
  if (af > 0.05) {
    return { label: 'Common', color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-300' }
  }
  if (af > 0.01) {
    return { label: 'Low frequency', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-300' }
  }
  if (af > 0.001) {
    return { label: 'Rare', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-300' }
  }
  if (af > 0.0001) {
    return { label: 'Very rare', color: 'text-red-700', bgColor: 'bg-red-50 border-red-300' }
  }
  return { label: 'Ultra-rare', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-300' }
}

function getACMGCriteria(af: number): { code: string; description: string; type: 'benign' | 'pathogenic' } | null {
  if (af > 0.05) {
    return { code: 'BA1', description: 'Stand-alone evidence of benign impact (AF > 5%)', type: 'benign' }
  }
  if (af > 0.01) {
    return { code: 'BS1', description: 'Strong evidence of benign impact (AF > 1%)', type: 'benign' }
  }
  if (af < 0.0001) {
    return { code: 'PM2', description: 'Absent or extremely rare in population databases', type: 'pathogenic' }
  }
  return null
}

function formatOneInX(af: number): string {
  if (af === 0) return 'Not observed'
  const oneIn = Math.round(1 / af)
  return `1 in ${oneIn.toLocaleString()}`
}

function getProgressWidth(af: number): number {
  if (af === 0) return 0
  const logAF = Math.log10(af)
  const normalized = ((logAF + 6) / 5.7) * 100
  return Math.max(2, Math.min(100, normalized))
}

export function GnomADCard({
  globalAF,
  globalAC,
  globalAN,
  globalHom,
  popmax,
  popmaxAF,
  chromosome,
  position,
  refAllele,
  altAllele,
}: GnomADCardProps) {
  const hasData = globalAF !== null || globalAC !== null

  const rarity = useMemo(() => {
    if (globalAF === null || globalAF === 0) return null
    return getRarityCategory(globalAF)
  }, [globalAF])

  const acmgCriteria = useMemo(() => {
    if (globalAF === null) return null
    return getACMGCriteria(globalAF)
  }, [globalAF])

  const populationName = useMemo(() => {
    if (!popmax) return null
    return POPULATION_NAMES[popmax.toLowerCase()] || popmax.toUpperCase()
  }, [popmax])

  // Build gnomAD URL - format: chr-pos-ref-alt
  const gnomadUrl = useMemo(() => {
    if (chromosome && position && refAllele && altAllele) {
      const chr = chromosome.replace(/^chr/i, '')
      return `https://gnomad.broadinstitute.org/variant/${chr}-${position}-${refAllele}-${altAllele}?dataset=gnomad_r4`
    }
    return null
  }, [chromosome, position, refAllele, altAllele])

  if (!hasData) return null

  const isAbsent = globalAF === null || globalAF === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          gnomAD v4.1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Global Frequency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium">Global Allele Frequency</span>
            {rarity && (
              <Badge variant="outline" className={`text-sm ${rarity.bgColor} ${rarity.color}`}>
                {rarity.label}
              </Badge>
            )}
          </div>

          {isAbsent ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-lg font-semibold text-purple-900">Not observed in gnomAD</p>
              <p className="text-sm text-purple-700 mt-1">
                This variant has not been observed in the gnomAD database
              </p>
            </div>
          ) : (
            <>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  style={{ width: `${getProgressWidth(globalAF!)}%` }}
                />
              </div>
              <div>
                <span className="text-2xl font-bold">{formatOneInX(globalAF!)}</span>
              </div>
            </>
          )}
        </div>

        {/* AC / AN / Hom */}
        {(globalAC !== null || globalAN !== null || globalHom !== null) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold">{globalAC?.toLocaleString() ?? '-'}</p>
              <p className="text-sm text-muted-foreground">Allele Count</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold">{globalAN?.toLocaleString() ?? '-'}</p>
              <p className="text-sm text-muted-foreground">Allele Number</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-bold">{globalHom ?? '-'}</p>
              <p className="text-sm text-muted-foreground">Homozygotes</p>
            </div>
          </div>
        )}

        {/* PopMax */}
        {popmax && popmaxAF !== null && (
          <div className="space-y-2">
            <span className="text-base text-muted-foreground">Highest Population Frequency</span>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium">{populationName}</span>
                <Badge variant="outline" className="text-sm font-mono">{popmax.toUpperCase()}</Badge>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  style={{ width: `${getProgressWidth(popmaxAF)}%` }}
                />
              </div>
              <div>
                <span className="text-lg font-semibold">{formatOneInX(popmaxAF)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ACMG Criteria */}
        {acmgCriteria && (
          <div className={`p-3 rounded-lg border ${
            acmgCriteria.type === 'benign' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-sm font-mono ${
                acmgCriteria.type === 'benign'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}>
                {acmgCriteria.code}
              </Badge>
              <span className={`text-sm font-medium ${
                acmgCriteria.type === 'benign' ? 'text-green-800' : 'text-red-800'
              }`}>
                ACMG Frequency Criteria
              </span>
            </div>
            <p className={`text-sm ${acmgCriteria.type === 'benign' ? 'text-green-700' : 'text-red-700'}`}>
              {acmgCriteria.description}
            </p>
          </div>
        )}

        {/* External Link */}
        {gnomadUrl && (
          <div className="pt-2 border-t">
            
              <a href={gnomadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View in gnomAD Browser
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

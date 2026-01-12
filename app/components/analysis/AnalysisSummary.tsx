"use client"

/**
 * AnalysisSummary Component - Classification Results Overview
 *
 * Typography Scale:
 * - text-3xl: Page titles
 * - text-lg: Section headers, card titles
 * - text-base: Primary content, instructions
 * - text-md: Secondary descriptions
 * - text-sm: Helper text, file info
 * - text-xs: Technical metadata
 *
 * Features:
 * - Classification breakdown with visual bars
 * - Impact distribution
 * - Top genes with variants
 * - Quick action buttons for filtering
 */

import { useMemo } from 'react'
import { useVariantStatistics } from '@/hooks/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Shield,
  Dna,
  BarChart3,
  Zap,
  TrendingUp
} from 'lucide-react'

interface AnalysisSummaryProps {
  sessionId: string
  onFilterByClass?: (acmgClass: string) => void
}

const ACMG_CONFIG = {
  'Pathogenic': {
    color: 'bg-red-500',
    textColor: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    priority: 1,
  },
  'Likely Pathogenic': {
    color: 'bg-orange-500',
    textColor: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: AlertTriangle,
    priority: 2,
  },
  'Uncertain Significance': {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: HelpCircle,
    priority: 3,
  },
  'Likely Benign': {
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Shield,
    priority: 4,
  },
  'Benign': {
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    priority: 5,
  },
}

const IMPACT_CONFIG = {
  'high': { color: 'bg-red-500', label: 'HIGH' },
  'moderate': { color: 'bg-orange-500', label: 'MODERATE' },
  'low': { color: 'bg-yellow-500', label: 'LOW' },
  'modifier': { color: 'bg-gray-400', label: 'MODIFIER' },
}

export function AnalysisSummary({ sessionId, onFilterByClass }: AnalysisSummaryProps) {
  const { data: stats, isLoading, error } = useVariantStatistics(sessionId)

  // Calculate percentages and sort classifications
  const classificationData = useMemo(() => {
    if (!stats) return []

    const total = stats.total_variants
    return Object.entries(stats.classification_breakdown)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        config: ACMG_CONFIG[name as keyof typeof ACMG_CONFIG] || ACMG_CONFIG['Uncertain Significance'],
      }))
      .sort((a, b) => a.config.priority - b.config.priority)
  }, [stats])

  // Impact data
  const impactData = useMemo(() => {
    if (!stats) return []

    const total = stats.total_variants
    return Object.entries(stats.impact_breakdown)
      .map(([name, count]) => ({
        name: name.toLowerCase(),
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        config: IMPACT_CONFIG[name.toLowerCase() as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG['modifier'],
      }))
      .sort((a, b) => {
        const order = ['high', 'moderate', 'low', 'modifier']
        return order.indexOf(a.name) - order.indexOf(b.name)
      })
  }, [stats])

  // Clinically significant count
  const clinicallySignificant = useMemo(() => {
    if (!stats) return 0
    return (stats.classification_breakdown['Pathogenic'] || 0) +
           (stats.classification_breakdown['Likely Pathogenic'] || 0)
  }, [stats])

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-3">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-base font-medium">Failed to load statistics</p>
              <p className="text-md text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Total Variants */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Dna className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">{stats.total_variants.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinically Significant */}
        <Card className={clinicallySignificant > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${clinicallySignificant > 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-muted'}`}>
                <AlertCircle className={`h-5 w-5 ${clinicallySignificant > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pathogenic / Likely Path.</p>
                <p className="text-2xl font-bold">{clinicallySignificant.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VUS Count */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
                <HelpCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VUS</p>
                <p className="text-2xl font-bold">
                  {(stats.classification_breakdown['Uncertain Significance'] || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benign */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Benign / Likely Benign</p>
                <p className="text-2xl font-bold">
                  {((stats.classification_breakdown['Benign'] || 0) +
                    (stats.classification_breakdown['Likely Benign'] || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classification Breakdown & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACMG Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ACMG Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classificationData.map((item) => {
              const Icon = item.config.icon
              return (
                <div
                  key={item.name}
                  className={`p-3 rounded-lg border ${item.config.bgColor} ${item.config.borderColor} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => onFilterByClass?.(item.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.config.textColor}`} />
                      <span className={`text-base font-medium ${item.config.textColor}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">{item.count.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={item.percentage}
                    className="h-2"
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Impact & Top Genes */}
        <div className="space-y-6">
          {/* Impact Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Impact Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {impactData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.config.color}`} />
                    <span className="text-base font-medium w-24">{item.config.label}</span>
                    <div className="flex-1">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Genes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Genes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_genes.slice(0, 5).map((gene, index) => (
                  <div
                    key={gene.gene_symbol}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-5">{index + 1}.</span>
                      <Badge variant="outline" className="font-mono text-base">
                        {gene.gene_symbol}
                      </Badge>
                    </div>
                    <span className="text-base font-medium">
                      {gene.variant_count} variants
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

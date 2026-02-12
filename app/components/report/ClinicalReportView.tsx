"use client"

/**
 * ClinicalReportView - Displays AI-generated clinical interpretation
 *
 * Renders the saved markdown interpretation with metadata about
 * interpretation level and modules used. Supports regeneration.
 */

import { useState, useCallback } from 'react'
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  CheckCircle2,
  Sparkles,
  Dna,
  Filter,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useClinicalInterpretation } from '@/contexts/ClinicalInterpretationContext'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { toast } from 'sonner'

interface ClinicalReportViewProps {
  sessionId: string
}

const LEVEL_CONFIG: Record<number, { label: string; description: string; color: string }> = {
  1: {
    label: 'Variants Only',
    description: 'Basic ACMG classification analysis without phenotype or screening context',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  2: {
    label: 'Variants + Screening',
    description: 'Age-aware prioritization with constraint scores and deleteriousness ranking',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  3: {
    label: 'Variants + Phenotype',
    description: 'Genotype-phenotype correlation with tier analysis and inheritance validation',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  4: {
    label: 'Full Analysis',
    description: 'Complete interpretation with phenotype, screening, and literature support',
    color: 'bg-green-100 text-green-700 border-green-300',
  },
}

const MODULE_ICONS: Record<string, typeof Dna> = {
  variants: Dna,
  screening: Filter,
  phenotype: Dna,
  literature: BookOpen,
}

export function ClinicalReportView({ sessionId }: ClinicalReportViewProps) {
  const {
    status,
    content,
    metadata,
    error,
    isGenerating,
    generate,
  } = useClinicalInterpretation()

  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      await generate(sessionId)
      toast.success('Clinical interpretation regenerated')
    } catch (err) {
      toast.error('Failed to regenerate interpretation')
    } finally {
      setIsRegenerating(false)
    }
  }, [sessionId, generate])

  const handleDownload = useCallback(() => {
    if (!content) return

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinical-interpretation-${sessionId.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }, [content, sessionId])

  const levelConfig = metadata ? LEVEL_CONFIG[metadata.level] || LEVEL_CONFIG[1] : null

  // Generating state
  if (isGenerating) {
    return (
      <div className="p-6 space-y-6">
        <Header />
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Generating clinical interpretation...</p>
          <p className="text-sm text-muted-foreground mt-1">
            AI is analyzing all available data. This may take 30-60 seconds.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="p-6 space-y-6">
        <Header />
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-base font-medium mb-2">Interpretation Failed</p>
            <p className="text-sm text-muted-foreground mb-4">{error?.message}</p>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="text-base">Retry</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No content yet
  if (!content) {
    return (
      <div className="p-6 space-y-6">
        <Header />
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Interpretation Available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a clinical interpretation based on all available analysis data.
            </p>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              <Sparkles className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="text-base">Generate Interpretation</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success - show report
  return (
    <div className="p-6 space-y-6">
      {/* Header with actions */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Clinical Report</h1>
          <p className="text-base text-muted-foreground mt-1">
            AI-generated clinical interpretation based on all available analysis data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-sm">Download</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="text-sm">Regenerate</span>
          </Button>
        </div>
      </div>

      {/* Metadata bar */}
      {metadata && levelConfig && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={`text-sm ${levelConfig.color}`}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Level {metadata.level}: {levelConfig.label}
          </Badge>
          {metadata.modules_used.map((mod) => {
            const Icon = MODULE_ICONS[mod] || FileText
            return (
              <Badge key={mod} variant="secondary" className="text-sm capitalize">
                <Icon className="h-3 w-3 mr-1" />
                {mod}
              </Badge>
            )
          })}
          <span className="text-sm text-muted-foreground">
            {(metadata.content_length / 1000).toFixed(1)}k characters
          </span>
        </div>
      )}

      {/* Report content */}
      <Card>
        <CardContent className="p-0 prose prose-sm dark:prose-invert max-w-none">
          <MarkdownMessage content={content} isUser={false} />
        </CardContent>
      </Card>
    </div>
  )
}

// Simple header for non-success states
function Header() {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-lg bg-primary/10">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">Clinical Report</h1>
        <p className="text-base text-muted-foreground mt-1">
          AI-generated clinical interpretation
        </p>
      </div>
    </div>
  )
}

"use client"

/**
 * ScreeningReportView - Displays AI-generated screening findings report
 *
 * Simpler than ClinicalReportView -- no levels, no modules metadata.
 * Shows rendered markdown with download and regenerate options.
 */

import { useState, useCallback } from 'react'
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  ChevronDown,
  Sparkles,
  Shield,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@helix/shared/components/ui/dropdown-menu'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { downloadClinicalReport } from '@/lib/utils/download-report'
import { useScreeningReport, useGenerateScreeningReport } from '@/hooks/mutations/use-screening-report'
import { useSession } from '@/contexts/SessionContext'
import { toast } from 'sonner'

interface ScreeningReportViewProps {
  sessionId: string
}

export function ScreeningReportView({ sessionId }: ScreeningReportViewProps) {
  const { data: report, isLoading, refetch } = useScreeningReport(sessionId)
  const generateReport = useGenerateScreeningReport()
  const { setSelectedModule } = useSession()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      await generateReport.mutateAsync(sessionId)
      await refetch()
      toast.success('Screening report regenerated')
    } catch (err) {
      toast.error('Failed to regenerate screening report')
    } finally {
      setIsRegenerating(false)
    }
  }, [sessionId, generateReport, refetch])

  const handleDownload = useCallback(async (format: 'md' | 'docx' | 'pdf') => {
    if (!report?.content) return
    try {
      await downloadClinicalReport(report.content, format, `screening-report-${sessionId.slice(0, 8)}`)
      toast.success(`Report downloaded as ${format.toUpperCase()}`)
    } catch (err) {
      toast.error('Download failed. Please try again.')
    }
  }, [report, sessionId])

  const handleBack = useCallback(() => {
    setSelectedModule('vus')
  }, [setSelectedModule])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <ReportHeader onBack={handleBack} />
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Loading screening report...</p>
        </div>
      </div>
    )
  }

  // Generating state
  if (generateReport.isPending) {
    return (
      <div className="p-6 space-y-6">
        <ReportHeader onBack={handleBack} />
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base font-medium">Generating screening findings report...</p>
          <p className="text-md text-muted-foreground mt-1">
            AI is analyzing screening results and panel data. This may take 15-30 seconds.
          </p>
        </div>
      </div>
    )
  }

  // No report yet
  if (!report?.content) {
    return (
      <div className="p-6 space-y-6">
        <ReportHeader onBack={handleBack} />
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">No Screening Report Available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a screening findings report based on variant screening results.
            </p>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              <Sparkles className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="text-base">Generate Report</span>
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
        <button
          onClick={handleBack}
          className="p-2.5 rounded-lg bg-primary/10 shrink-0 hover:bg-primary/20 transition-colors"
          title="Back to Clinical Screening"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">Screening Findings Report</h1>
          <p className="text-base text-muted-foreground mt-1">
            AI-generated screening analysis with therapy recommendations
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-sm">Download</span>
                <ChevronDown className="h-3 w-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => handleDownload('pdf')}
                className="cursor-pointer text-md"
              >
                <Download className="h-3 w-3 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownload('docx')}
                className="cursor-pointer text-md"
              >
                <Download className="h-3 w-3 mr-2" />
                DOCX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownload('md')}
                className="cursor-pointer text-md"
              >
                <Download className="h-3 w-3 mr-2" />
                Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="text-sm">Regenerate</span>
          </Button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-sm bg-green-100 text-green-700 border-green-300">
          <Shield className="h-3 w-3 mr-1" />
          Screening Analysis
        </Badge>
        <span className="text-sm text-muted-foreground">
          {(report.content_length / 1000).toFixed(1)}k characters
        </span>
      </div>

      {/* Report content */}
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="px-6 pt-1 pb-6 min-w-0 overflow-hidden">
          <div className="overflow-x-auto prose prose-sm max-w-none dark:prose-invert prose-h1:mt-0 prose-h1:mb-3 prose-h2:mt-2 prose-h2:mb-0 prose-table:my-2 prose-hr:my-2 prose-p:my-2">
            <MarkdownMessage content={report.content} isUser={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simple header for non-success states
function ReportHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-start gap-4">
      <button
        onClick={onBack}
        className="p-2.5 rounded-lg bg-primary/10 shrink-0 hover:bg-primary/20 transition-colors"
        title="Back to Clinical Screening"
      >
        <ArrowLeft className="h-5 w-5 text-primary" />
      </button>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">Screening Findings Report</h1>
        <p className="text-base text-muted-foreground mt-1">
          AI-generated screening analysis with therapy recommendations
        </p>
      </div>
    </div>
  )
}

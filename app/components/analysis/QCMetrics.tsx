"use client"

/**
 * QCMetrics Component - Display Quality Control Results
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
 * - Display QC metrics after file upload
 * - Downloadable QC report
 * - Info tooltips for metrics
 * - Next step CTA (phenotype entry)
 */

import { Download, Info, FileCode, Dna } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { QCMetrics as QCMetricsType } from '@/types/variant.types'

interface QCMetricsProps {
  metrics: QCMetricsType
  fileName?: string
  fileSize?: number
  onPhenotypeClick?: () => void
}

export function QCMetrics({
  metrics,
  fileName,
  fileSize,
  onPhenotypeClick
}: QCMetricsProps) {

  const handleDownloadReport = () => {
    const report = {
      file: fileName,
      timestamp: new Date().toISOString(),
      metrics,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qc-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <FileCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-base font-medium truncate">{fileName}</p>
              {fileSize && (
                <>
                  <span className="text-muted-foreground">-</span>
                  <p className="text-sm text-muted-foreground">
                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* QC Header */}
          <div className="flex items-center justify-between pt-4 mb-4">
            <h3 className="text-lg font-semibold">Quality Control Results</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="text-sm">Download Report</span>
            </Button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Variants */}
            <div className="p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">
                Total Variants
              </p>
              <p className="text-2xl font-semibold">
                {metrics.total_variants.toLocaleString()}
              </p>
            </div>

            {/* Ti/Tv Ratio */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Ti/Tv Ratio</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        <strong>Transition/Transversion Ratio</strong> - Expected value ~2.0-2.1 for WGS.
                        Values significantly outside this range may indicate sequencing artifacts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-semibold">
                {metrics.ti_tv_ratio.toFixed(2)}
              </p>
            </div>

            {/* Het/Hom Ratio */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Het/Hom Ratio</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        <strong>Heterozygous/Homozygous Ratio</strong> - Typical range 1.5-2.0 for WGS.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-semibold">
                {metrics.het_hom_ratio.toFixed(2)}
              </p>
            </div>

            {/* Mean Depth */}
            <div className="p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">
                Mean Depth
              </p>
              <p className="text-2xl font-semibold">
                {metrics.mean_depth.toFixed(1)}x
              </p>
            </div>
          </div>

          {/* QC Status */}
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-base font-medium text-green-900 dark:text-green-100">
              Quality control passed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Step CTA */}
      {onPhenotypeClick && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Dna className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Next: Add phenotype data to improve variant prioritization
                </h3>
                <p className="text-md text-muted-foreground mb-4">
                  Providing patient phenotype information enables more accurate
                  variant-phenotype matching and prioritization.
                </p>
                <Button
                  onClick={onPhenotypeClick}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Dna className="h-4 w-4 mr-2" />
                  <span className="text-base">Enter Phenotype</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

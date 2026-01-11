"use client"

/**
 * Query Visualization Router
 * Routes to appropriate chart component based on visualization config
 */

import { PieChart, BarChart } from '@/components/charts'
import { VariantsCompactTable } from '@/components/analysis'
import { useAnalysis } from '@/contexts/AnalysisContext'
import type { VisualizationConfig } from '@/types/visualization.types'

interface QueryVisualizationProps {
  data: any[]
  config: VisualizationConfig
}

export function QueryVisualization({ data, config }: QueryVisualizationProps) {
  const { setSelectedVariantId, openDetails } = useAnalysis()

  // Handler for variant click - opens detail panel
  const handleVariantClick = (variantIdx: number) => {
    setSelectedVariantId(variantIdx.toString())
    openDetails()
  }

  // Route to appropriate chart component
  switch (config.type) {
    case 'acmg_pie':
      return <PieChart data={data} config={config} />

    case 'impact_bar':
    case 'gene_bar':
    case 'chromosome_bar':
    case 'consequence_bar':
      return <BarChart data={data} config={config as any} />

    case 'clinical_scatter':
      return (
        <div className="p-6 bg-muted/50 rounded-lg">
          <p className="text-base font-medium">Clinical Scatter Plot</p>
          <p className="text-sm text-muted-foreground mt-2">
            Advanced visualization coming soon...
          </p>
        </div>
      )

    case 'table':
      // DEFENSIVE: Check data
      if (!data || data.length === 0) {
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-base font-medium">{config.title}</p>
            <p className="text-sm text-muted-foreground mt-2">No data available</p>
          </div>
        )
      }

      // Check if this is variant data (has variant_idx column)
      const isVariantData = data.length > 0 && 'variant_idx' in data[0]

      if (isVariantData) {
        // Use compact table for variants
        return (
          <div className="w-full">
            <div className="mb-3">
              <h3 className="text-base font-semibold">{config.title}</h3>
              {config.description && (
                <p className="text-sm text-muted-foreground">{config.description}</p>
              )}
            </div>
            <VariantsCompactTable
              data={data}
              onVariantClick={handleVariantClick}
            />
            <div className="mt-3 text-xs text-muted-foreground">
              {data.length} variants • Click any row to view details
            </div>
          </div>
        )
      }

      // Fallback: generic table for non-variant data
      return (
        <div className="w-full">
          <div className="mb-3">
            <h3 className="text-base font-semibold">{config.title}</h3>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {Object.keys(data[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left text-xs font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-3 py-2 text-xs">
                        {typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    default: {
      const unknownConfig = config as { type: string; title: string }
      return (
        <div className="p-6 bg-muted/50 rounded-lg">
          <p className="text-base font-medium">{unknownConfig.title || 'Unknown Visualization'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Visualization type "{unknownConfig.type}" is not supported
          </p>
        </div>
      )
    }
  }
}

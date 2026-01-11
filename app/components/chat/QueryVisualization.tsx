"use client"

/**
 * Query Visualization Router
 * Routes to appropriate chart component based on visualization config
 */

import { PieChart, BarChart } from '@/components/charts'
import type { VisualizationConfig } from '@/types/visualization.types'

interface QueryVisualizationProps {
  data: any[]
  config: VisualizationConfig
}

export function QueryVisualization({ data, config }: QueryVisualizationProps) {
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
          <div className="p-6 bg-muted/50 rounded-lg">
            <p className="text-base font-medium">{config.title}</p>
            <p className="text-sm text-muted-foreground mt-2">No data available</p>
          </div>
        )
      }

      return (
        <div className="w-full">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{config.title}</h3>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(data[0]).map(key => (
                    <th key={key} className="px-4 py-2 text-left font-medium bg-muted/50">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-2">
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

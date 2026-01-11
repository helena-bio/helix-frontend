"use client"

/**
 * Query Visualization Router
 * Routes to appropriate chart component based on visualization config
 */

import { ACMGPieChart, ImpactBarChart, GeneBarChart, ChromosomeBarChart } from '@/components/charts'
import type { VisualizationConfig } from '@/types/visualization.types'

interface QueryVisualizationProps {
  data: any[]
  config: VisualizationConfig
}

export function QueryVisualization({ data, config }: QueryVisualizationProps) {
  // Route to appropriate chart component
  switch (config.type) {
    case 'acmg_pie':
      return <ACMGPieChart data={data} config={config} />
    
    case 'impact_bar':
      return <ImpactBarChart data={data} config={config} />
    
    case 'gene_bar':
      return <GeneBarChart data={data} config={config} />
    
    case 'chromosome_bar':
      return <ChromosomeBarChart data={data} config={config} />
    
    case 'consequence_bar':
      // Similar to gene_bar but for consequences
      return <GeneBarChart data={data} config={config as any} />
    
    case 'clinical_scatter':
      // TODO: Implement scatter plot (Phase 3)
      return (
        <div className="p-6 bg-muted/50 rounded-lg">
          <p className="text-base font-medium">Clinical Scatter Plot</p>
          <p className="text-sm text-muted-foreground mt-2">
            Advanced visualization coming soon...
          </p>
        </div>
      )
    
    case 'table':
      // Fallback to table view
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {data.length > 0 && Object.keys(data[0]).map(key => (
                  <th key={key} className="px-4 py-2 text-left font-medium">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b">
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} className="px-4 py-2">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    
    default: {
      // Explicit type assertion for default case
      const unknownConfig = config as { type: string }
      return (
        <div className="p-6 bg-muted/50 rounded-lg">
          <p className="text-base font-medium">Unknown Visualization Type</p>
          <p className="text-sm text-muted-foreground mt-2">
            Type: {unknownConfig.type}
          </p>
        </div>
      )
    }
  }
}

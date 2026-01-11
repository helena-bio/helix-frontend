"use client"

/**
 * Chromosome Distribution Bar Chart
 * Genomic sort order (chr1-22, X, Y, M)
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChromosomeBarConfig } from '@/types/visualization.types'

interface ChromosomeBarChartProps {
  data: any[]
  config: ChromosomeBarConfig
}

export function ChromosomeBarChart({ data, config }: ChromosomeBarChartProps) {
  // Sort chromosomes genomically
  const sortedData = [...data].sort((a, b) => {
    const chrA = a[config.category_column]
    const chrB = b[config.category_column]
    
    const indexA = config.sort_order.indexOf(chrA)
    const indexB = config.sort_order.indexOf(chrB)
    
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    
    return indexA - indexB
  })

  const chartData = sortedData.map(item => ({
    name: item[config.category_column].replace('chr', ''),
    value: item[config.value_column],
  }))

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--foreground))' }}
            style={{ fontSize: '13px' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--foreground))' }}
            label={{ value: 'Variant Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number | undefined) => [`${value || 0} variants`, 'Count']}
            labelFormatter={(label) => `Chromosome ${label}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

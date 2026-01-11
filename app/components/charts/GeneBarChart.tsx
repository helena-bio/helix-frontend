"use client"

/**
 * Gene Distribution Bar Chart
 * Shows top N genes by variant count, with optional pLI overlay
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import type { GeneBarConfig } from '@/types/visualization.types'

interface GeneBarChartProps {
  data: any[]
  config: GeneBarConfig
}

export function GeneBarChart({ data, config }: GeneBarChartProps) {
  // Sort and limit data
  const sortedData = [...data]
    .sort((a, b) => b[config.value_column] - a[config.value_column])
    .slice(0, config.limit)

  const chartData = sortedData.map(item => ({
    name: item[config.category_column],
    value: item[config.value_column],
    pli: config.overlay ? item[config.overlay.column] : undefined,
  }))

  const hasOverlay = config.overlay && chartData.some(d => d.pli !== undefined)

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {hasOverlay ? (
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Variant Count', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: config.overlay!.color }}
              label={{ value: config.overlay!.label, angle: 90, position: 'insideRight' }}
              domain={[0, 1]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar yAxisId="left" dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="pli" 
              stroke={config.overlay!.color} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
            <Tooltip 
              formatter={(value: number | undefined) => [`${value || 0} variants`, 'Count']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>

      {hasOverlay && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            pLI (probability of loss-of-function intolerance): Values &gt; 0.9 indicate genes highly intolerant to loss-of-function variants.
          </p>
        </div>
      )}
    </div>
  )
}

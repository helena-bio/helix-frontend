"use client"

/**
 * Impact Level Bar Chart
 * Severity-based color scheme (HIGH=red, MODERATE=amber, LOW=blue, MODIFIER=gray)
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ImpactBarConfig } from '@/types/visualization.types'

interface ImpactBarChartProps {
  data: any[]
  config: ImpactBarConfig
}

export function ImpactBarChart({ data, config }: ImpactBarChartProps) {
  // Sort data according to config.order
  const sortedData = [...data].sort((a, b) => {
    const orderA = config.order.indexOf(a[config.category_column])
    const orderB = config.order.indexOf(b[config.category_column])
    return orderA - orderB
  })

  const chartData = sortedData.map(item => ({
    name: item[config.category_column],
    value: item[config.value_column],
  }))

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--foreground))' }}
            style={{ fontSize: '14px' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--foreground))' }}
            style={{ fontSize: '14px' }}
          />
          <Tooltip 
            formatter={(value: number | undefined) => [`${value || 0} variants`, 'Count']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={config.colors[entry.name as keyof typeof config.colors]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: config.colors.HIGH }} />
          <span>HIGH: Loss-of-function</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: config.colors.MODERATE }} />
          <span>MODERATE: Missense</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: config.colors.LOW }} />
          <span>LOW: Synonymous</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: config.colors.MODIFIER }} />
          <span>MODIFIER: Intron/UTR</span>
        </div>
      </div>
    </div>
  )
}

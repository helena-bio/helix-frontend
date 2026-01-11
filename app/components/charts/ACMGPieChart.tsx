"use client"

/**
 * ACMG Classification Pie Chart
 * Medical-grade color scheme for variant pathogenicity
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { ACMGPieConfig } from '@/types/visualization.types'

interface ACMGPieChartProps {
  data: any[]
  config: ACMGPieConfig
}

export function ACMGPieChart({ data, config }: ACMGPieChartProps) {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item[config.category_column],
    value: item[config.value_column],
  }))

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={config.colors[entry.name as keyof typeof config.colors]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} variants`, 'Count']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {config.medical_context && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Clinical interpretation follows ACMG/AMP 2015 guidelines. 
            Pathogenic and Likely Pathogenic variants require clinical review.
          </p>
        </div>
      )}
    </div>
  )
}

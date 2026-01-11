"use client"

/**
 * Universal Pie Chart Component
 * Generic pie chart with custom colors and labels
 */

import { PieChart as RechartsBase, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PieChartConfig {
  title: string
  description?: string
  category_column: string
  value_column: string
  colors: Record<string, string>
  note?: string
}

interface PieChartProps {
  data: any[]
  config: PieChartConfig
}

export function PieChart({ data, config }: PieChartProps) {
  // DEFENSIVE: Check if data exists and is valid
  if (!data || data.length === 0) {
    return (
      <div className="w-full p-6 bg-muted/50 rounded-lg">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">{config.title}</h3>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Transform data for Recharts
  const chartData = data
    .map(item => ({
      name: item[config.category_column],
      value: item[config.value_column],
    }))
    .filter(item => item.name && item.value !== undefined && item.value !== null)

  // DEFENSIVE: Check transformed data
  if (chartData.length === 0) {
    return (
      <div className="w-full p-6 bg-muted/50 rounded-lg">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">{config.title}</h3>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Invalid data format for columns: {config.category_column}, {config.value_column}
        </p>
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

      <ResponsiveContainer width="100%" height={350}>
        <RechartsBase>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={config.colors[entry.name] || '#cbd5e1'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [`${value || 0} variants`, 'Count']}
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
        </RechartsBase>
      </ResponsiveContainer>

      {config.note && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">{config.note}</p>
        </div>
      )}
    </div>
  )
}

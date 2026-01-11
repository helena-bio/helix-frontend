"use client"

/**
 * Universal Pie Chart Component
 * Uses Tailwind default color palette (matching AnalysisSummary)
 */

import { PieChart as RechartsBase, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PieChartConfig {
  title: string
  description?: string
  category_column: string
  value_column: string
  colors?: Record<string, string>
  note?: string
}

interface PieChartProps {
  data: any[]
  config: PieChartConfig
}

// Tailwind default color palette - matching AnalysisSummary component
// These are the exact values from Tailwind CSS v3 default theme
const CHART_COLORS: Record<string, string> = {
  // ACMG Classifications - using 500 shades (same as AnalysisSummary icons/text)
  'Pathogenic': '#ef4444',           // red-500
  'Likely Pathogenic': '#f97316',    // orange-500
  'Uncertain Significance': '#eab308', // yellow-500
  'Likely Benign': '#3b82f6',        // blue-500
  'Benign': '#22c55e',               // green-500
  
  // Impact Levels - same as AnalysisSummary
  'HIGH': '#ef4444',      // red-500
  'MODERATE': '#f97316',  // orange-500
  'LOW': '#eab308',       // yellow-500
  'MODIFIER': '#9ca3af',  // gray-400
  
  // Fallback
  'default': '#6366f1',   // indigo-500
}

export function PieChart({ data, config }: PieChartProps) {
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

  const chartData = data
    .map(item => ({
      name: item[config.category_column],
      value: item[config.value_column],
    }))
    .filter(item => item.name && item.value !== undefined && item.value !== null)

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

  const getColor = (name: string): string => {
    return CHART_COLORS[name] || CHART_COLORS['default']
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
                fill={getColor(entry.name)}
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

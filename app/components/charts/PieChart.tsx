"use client"

/**
 * Universal Pie Chart Component  
 * Colors extracted from dashboard LAB values converted to hex
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

// Dashboard-matching colors
// Fill: Background colors (светли)
// Labels/Legend: Text colors (тъмни)
const CHART_FILL_COLORS: Record<string, string> = {
  'Pathogenic': '#fff085',           // Светло жълто
  'Likely Pathogenic': '#ffd6a7',    // Светло праскова
  'Uncertain Significance': '#fff085', // Светло жълто  
  'Likely Benign': '#bedbff',        // Светло синьо
  'Benign': '#b9f8cf',               // Светло зелено
  'default': '#cbd5e1',              // gray-300
}

const CHART_TEXT_COLORS: Record<string, string> = {
  'Pathogenic': '#c10007',           // Тъмно червено
  'Likely Pathogenic': '#a65f00',    // Тъмно оранжево
  'Uncertain Significance': '#ca3500', // Тъмно кафяво
  'Likely Benign': '#1447e6',        // Тъмно синьо
  'Benign': '#008236',               // Тъмно зелено
  'default': '#475569',              // slate-600
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

  const getFillColor = (name: string): string => {
    return CHART_FILL_COLORS[name] || CHART_FILL_COLORS['default']
  }

  const getTextColor = (name: string): string => {
    return CHART_TEXT_COLORS[name] || CHART_TEXT_COLORS['default']
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
            label={({ name, percent }) => ({
              value: `${name}: ${((percent || 0) * 100).toFixed(1)}%`,
              fill: getTextColor(name),
            })}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getFillColor(entry.name)}
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
            formatter={(value) => (
              <span className="text-sm" style={{ color: getTextColor(value) }}>
                {value}
              </span>
            )}
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

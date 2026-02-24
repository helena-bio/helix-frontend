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
const CHART_FILL_COLORS: Record<string, string> = {
  'P': '#fff085',
  'LP': '#ffd6a7',
  'VUS': '#fff085',
  'LB': '#bedbff',
  'B': '#b9f8cf',
  'default': '#cbd5e1',
}

const CHART_TEXT_COLORS: Record<string, string> = {
  'P': '#c10007',
  'LP': '#a65f00',
  'VUS': '#ca3500',
  'LB': '#1447e6',
  'B': '#008236',
  'default': '#475569',
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

  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, percent } = props
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 25
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill={getTextColor(name)}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 500 }}
      >
        {`${name}: ${((percent || 0) * 100).toFixed(1)}%`}
      </text>
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
            label={renderLabel}
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

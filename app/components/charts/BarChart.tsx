"use client"

/**
 * Universal Bar Chart Component
 * Generic bar chart with custom colors, sorting, and optional overlay line
 */

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  Legend
} from 'recharts'

interface BarChartConfig {
  title: string
  description?: string
  category_column: string
  value_column: string
  colors?: Record<string, string> | string
  sort_order?: string[]
  sort_by?: 'value' | 'category' | 'custom'
  limit?: number
  x_axis_angle?: number
  x_axis_height?: number
  show_legend?: boolean
  legend_items?: Array<{ label: string; color: string; description?: string }>
  note?: string
  overlay?: {
    type: 'line'
    column: string
    axis: 'secondary'
    label: string
    color: string
  }
}

interface BarChartProps {
  data: any[]
  config: BarChartConfig
}

export function BarChart({ data, config }: BarChartProps) {
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

  // Transform and filter data
  let processedData = data
    .map(item => ({
      name: item[config.category_column],
      value: item[config.value_column],
      overlay: config.overlay ? item[config.overlay.column] : undefined,
    }))
    .filter(item => item.name && item.value !== undefined && item.value !== null)

  // DEFENSIVE: Check transformed data
  if (processedData.length === 0) {
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

  // Apply sorting
  if (config.sort_order) {
    // Custom order (e.g., chr1-22, X, Y, M or HIGH, MODERATE, LOW)
    processedData = processedData.sort((a, b) => {
      const indexA = config.sort_order!.indexOf(a.name)
      const indexB = config.sort_order!.indexOf(b.name)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  } else if (config.sort_by === 'value') {
    // Sort by value descending
    processedData = processedData.sort((a, b) => b.value - a.value)
  }
  // Otherwise natural order (category alphabetical)

  // Apply limit
  if (config.limit && config.limit > 0) {
    processedData = processedData.slice(0, config.limit)
  }

  // Check if using color map or single color
  const isColorMap = typeof config.colors === 'object' && config.colors !== null
  const singleColor = typeof config.colors === 'string' ? config.colors : 'hsl(var(--primary))'

  // Check for overlay
  const hasOverlay = config.overlay && processedData.some(d => d.overlay !== undefined)

  // X-axis configuration
  const xAxisAngle = config.x_axis_angle ?? (processedData.length > 10 ? -45 : 0)
  const xAxisHeight = config.x_axis_height ?? (xAxisAngle !== 0 ? 80 : 30)

  const chartData = processedData.map(item => ({
    ...item,
    // Clean chromosome names (remove 'chr' prefix for display)
    displayName: item.name.toString().replace(/^chr/, ''),
  }))

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={hasOverlay ? 400 : 350}>
        {hasOverlay ? (
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: xAxisHeight }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="displayName"
              angle={xAxisAngle}
              textAnchor={xAxisAngle !== 0 ? 'end' : 'middle'}
              height={xAxisHeight}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
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
            <Bar yAxisId="left" dataKey="value" radius={[8, 8, 0, 0]}>
              {isColorMap
                ? chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(config.colors as Record<string, string>)[entry.name] || '#cbd5e1'}
                    />
                  ))
                : chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={singleColor} />
                  ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="overlay"
              stroke={config.overlay!.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={config.overlay!.label}
            />
          </ComposedChart>
        ) : (
          <RechartsBar
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: xAxisHeight }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="displayName"
              angle={xAxisAngle}
              textAnchor={xAxisAngle !== 0 ? 'end' : 'middle'}
              height={xAxisHeight}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number | undefined) => [`${value || 0}`, 'Count']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {isColorMap
                ? chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(config.colors as Record<string, string>)[entry.name] || '#cbd5e1'}
                    />
                  ))
                : chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={singleColor} />
                  ))}
            </Bar>
          </RechartsBar>
        )}
      </ResponsiveContainer>

      {/* Legend for color-coded categories */}
      {config.show_legend && config.legend_items && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {config.legend_items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate">
                <strong>{item.label}:</strong> {item.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Optional note */}
      {config.note && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">{config.note}</p>
        </div>
      )}
    </div>
  )
}

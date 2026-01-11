/**
 * Visualization Types for AI Query Results
 * Matches backend visualization suggestions
 */

export interface BaseVisualizationConfig {
  type: string
  title: string
  description: string
}

export interface ACMGPieConfig extends BaseVisualizationConfig {
  type: 'acmg_pie'
  category_column: string
  value_column: string
  colors: {
    'Pathogenic': string
    'Likely Pathogenic': string
    'Uncertain Significance': string
    'Likely Benign': string
    'Benign': string
  }
  medical_context: boolean
}

export interface ImpactBarConfig extends BaseVisualizationConfig {
  type: 'impact_bar'
  category_column: string
  value_column: string
  colors: {
    HIGH: string
    MODERATE: string
    LOW: string
    MODIFIER: string
  }
  order: string[]
}

export interface ChromosomeBarConfig extends BaseVisualizationConfig {
  type: 'chromosome_bar'
  category_column: string
  value_column: string
  sort_order: string[]
  genomic_sort: boolean
}

export interface GeneBarConfig extends BaseVisualizationConfig {
  type: 'gene_bar'
  category_column: string
  value_column: string
  sort_by: string
  limit: number
  overlay?: {
    type: 'line'
    column: string
    axis: 'secondary'
    label: string
    color: string
  }
}

export interface ClinicalScatterConfig extends BaseVisualizationConfig {
  type: 'clinical_scatter'
  x_column: string
  y_column: string
  label_column: string
  color_column?: string
  x_scale: 'linear' | 'log'
  quadrants: {
    top_left: string
    top_right: string
    bottom_left: string
    bottom_right: string
  }
}

export interface ConsequenceBarConfig extends BaseVisualizationConfig {
  type: 'consequence_bar'
  category_column: string
  value_column: string
  sort_by: string
  limit: number
}

export interface TableConfig extends BaseVisualizationConfig {
  type: 'table'
  sortable: boolean
  exportable: boolean
}

export type VisualizationConfig =
  | ACMGPieConfig
  | ImpactBarConfig
  | ChromosomeBarConfig
  | GeneBarConfig
  | ClinicalScatterConfig
  | ConsequenceBarConfig
  | TableConfig

export interface QueryResultMessage {
  role: 'assistant'
  content: string
  type: 'query_result'
  sql: string
  data: any[]
  rows_returned: number
  execution_time_ms: number
  summary?: string
  visualization?: VisualizationConfig
  timestamp: Date
}

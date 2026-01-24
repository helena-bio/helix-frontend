/**
 * AI Chat Types
 */
import type { VisualizationConfig } from './visualization.types'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  // Message type extensions
  type?: 'text' | 'query_result' | 'literature_result'
  // Query result data (variant queries)
  queryData?: {
    sql: string
    results: any[]
    rows_returned: number
    execution_time_ms: number
    visualization?: VisualizationConfig
  }
  // Literature search result data
  literatureData?: {
    sql: string
    results: any[]
    rows_returned: number
    execution_time_ms: number
    visualization?: VisualizationConfig
  }
}

export interface Conversation {
  id: string
  session_id?: string
  messages: Message[]
  created_at: Date
  updated_at: Date
}

export interface ChatStreamState {
  isStreaming: boolean
  currentMessage: string
  error?: string
}

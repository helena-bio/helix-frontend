/**
 * AI Chat Types
 */

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
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

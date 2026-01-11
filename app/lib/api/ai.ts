/**
 * AI Service API Client
 * Handles chat interactions with streaming support and query visualizations
 */

import { apiRequest } from './client'
import type { VisualizationConfig } from '@/types/visualization.types'

// Use environment variable or fallback to localhost for development
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:9007'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ChatRequest {
  message: string
  conversation_id?: string
  session_id?: string
}

export interface ChatResponse {
  conversation_id: string
  message: string
}

export interface QueryResultEvent {
  type: 'query_result'
  sql: string
  results: any[]
  rows_returned: number
  execution_time_ms: number
  visualization?: VisualizationConfig
}

export type StreamEvent = 
  | { type: 'token'; data: string }
  | { type: 'query_result'; data: QueryResultEvent }

/**
 * Send chat message (buffered response)
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>(
    `${AI_SERVICE_URL}/api/v1/chat`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  )
}

/**
 * Send chat message with streaming (SSE)
 * Returns tokens AND query result events
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<StreamEvent, void, undefined> {
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message' // Default event type

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      // Keep last incomplete line in buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        // SSE event type line
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          continue
        }

        // SSE data line
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // Remove 'data: ' prefix

          if (data === '[DONE]') {
            return
          }

          if (data.startsWith('[ERROR:')) {
            throw new Error(data)
          }

          // Handle based on event type
          if (currentEvent === 'query_result') {
            // Parse query result JSON
            try {
              const queryResult = JSON.parse(data) as QueryResultEvent
              yield { type: 'query_result', data: queryResult }
            } catch (e) {
              console.error('Failed to parse query result:', e)
            }
            // Reset to default event type
            currentEvent = 'message'
          } else {
            // Regular text token
            if (data) {
              yield { type: 'token', data }
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

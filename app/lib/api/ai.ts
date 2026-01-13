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
  metadata?: Record<string, any>
}

export interface ChatResponse {
  conversation_id: string
  message: string
}

export interface ConversationStartedEvent {
  type: 'conversation_started'
  conversation_id: string
}

export interface QueryingStartedEvent {
  type: 'querying_started'
}

export interface QueryResultEvent {
  type: 'query_result'
  sql: string
  results: any[]
  rows_returned: number
  execution_time_ms: number
  visualization?: VisualizationConfig
}

export interface RoundCompleteEvent {
  type: 'round_complete'
  round: number
}

export type StreamEvent =
  | { type: 'token'; data: string }
  | { type: 'conversation_started'; data: ConversationStartedEvent }
  | { type: 'querying_started'; data: QueryingStartedEvent }
  | { type: 'query_result'; data: QueryResultEvent }
  | { type: 'round_complete'; data: RoundCompleteEvent }

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
 * 
 * Event types:
 * - conversation_started: Initial event with conversation_id
 * - querying_started: AI is querying the database (show indicator)
 * - query_result: Query completed with results
 * - round_complete: Round finished, next round starting (create new bubble)
 * - token: Regular text token
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
          if (currentEvent === 'conversation_started') {
            try {
              const conversationEvent = JSON.parse(data) as ConversationStartedEvent
              yield { type: 'conversation_started', data: conversationEvent }
            } catch (e) {
              console.error('Failed to parse conversation_started:', e)
            }
            currentEvent = 'message'
          } else if (currentEvent === 'querying_started') {
            try {
              const queryingEvent = JSON.parse(data) as QueryingStartedEvent
              yield { type: 'querying_started', data: queryingEvent }
            } catch (e) {
              console.error('Failed to parse querying_started:', e)
            }
            currentEvent = 'message'
          } else if (currentEvent === 'query_result') {
            try {
              const queryResult = JSON.parse(data) as QueryResultEvent
              yield { type: 'query_result', data: queryResult }
            } catch (e) {
              console.error('Failed to parse query result:', e)
            }
            currentEvent = 'message'
          } else if (currentEvent === 'round_complete') {
            try {
              const roundEvent = JSON.parse(data) as RoundCompleteEvent
              yield { type: 'round_complete', data: roundEvent }
            } catch (e) {
              console.error('Failed to parse round_complete:', e)
            }
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

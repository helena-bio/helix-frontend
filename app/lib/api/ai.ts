/**
 * AI Service API Client
 * Handles chat interactions with streaming support and query visualizations
 */

import { apiRequest } from './client'
import type { VisualizationConfig } from '@/types/visualization.types'

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

// Literature search events
export interface LiteratureSearchingEvent {
  type: 'literature_searching'
}

export interface LiteratureResultEvent {
  type: 'literature_result'
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
  | { type: 'literature_searching'; data: LiteratureSearchingEvent }
  | { type: 'literature_result'; data: LiteratureResultEvent }
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
 * - literature_searching: AI is searching literature database
 * - literature_result: Literature search completed with publications
 * - round_complete: Round finished, next round starting (create new bubble)
 * - token: Regular text token (JSON-encoded to preserve newlines)
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

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let currentEvent = 'message'

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n')
          for (const line of lines) {
            const event = parseLine(line, currentEvent)
            if (event) {
              if (event.newEventType) {
                currentEvent = event.newEventType
              } else if (event.streamEvent) {
                yield event.streamEvent
                if (event.streamEvent.type !== 'token') {
                  currentEvent = 'message'
                }
              }
            }
          }
        }
        break
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete lines only
      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 1)

        const event = parseLine(line, currentEvent)
        if (event) {
          if (event.newEventType) {
            currentEvent = event.newEventType
          } else if (event.streamEvent) {
            yield event.streamEvent
            if (event.streamEvent.type !== 'token') {
              currentEvent = 'message'
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Parse a single SSE line
 */
function parseLine(
  line: string,
  currentEvent: string
): { newEventType?: string; streamEvent?: StreamEvent } | null {
  // Empty line - ignore
  if (!line.trim()) {
    return null
  }

  // SSE event type line
  if (line.startsWith('event: ')) {
    return { newEventType: line.slice(7).trim() }
  }

  // SSE data line
  if (line.startsWith('data: ')) {
    const data = line.slice(6)

    if (data === '[DONE]') {
      return null
    }

    if (data.startsWith('[ERROR:')) {
      throw new Error(data)
    }

    // Handle based on event type
    switch (currentEvent) {
      case 'conversation_started':
        try {
          const conversationEvent = JSON.parse(data) as ConversationStartedEvent
          return { streamEvent: { type: 'conversation_started', data: conversationEvent } }
        } catch {
          return null
        }

      case 'querying_started':
        try {
          const queryingEvent = JSON.parse(data) as QueryingStartedEvent
          return { streamEvent: { type: 'querying_started', data: queryingEvent } }
        } catch {
          return null
        }

      case 'query_result':
        try {
          const queryResult = JSON.parse(data) as QueryResultEvent
          return { streamEvent: { type: 'query_result', data: queryResult } }
        } catch {
          return null
        }

      case 'literature_searching':
        try {
          const literatureEvent = JSON.parse(data) as LiteratureSearchingEvent
          return { streamEvent: { type: 'literature_searching', data: literatureEvent } }
        } catch {
          return null
        }

      case 'literature_result':
        try {
          const literatureResult = JSON.parse(data) as LiteratureResultEvent
          return { streamEvent: { type: 'literature_result', data: literatureResult } }
        } catch {
          return null
        }

      case 'round_complete':
        try {
          const roundEvent = JSON.parse(data) as RoundCompleteEvent
          return { streamEvent: { type: 'round_complete', data: roundEvent } }
        } catch {
          return null
        }

      default:
        // Regular text token - JSON-encoded by backend to preserve newlines
        // Parse to get actual string with preserved special characters
        try {
          const token = JSON.parse(data) as string
          // Return token even if empty (empty string = newline was sent)
          return { streamEvent: { type: 'token', data: token } }
        } catch {
          // Fallback for backwards compatibility with non-JSON tokens
          console.warn('[SSE] Failed to parse token as JSON, using raw data')
          return { streamEvent: { type: 'token', data } }
        }
    }
  }

  return null
}

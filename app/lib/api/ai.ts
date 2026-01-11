/**
 * AI Service API Client
 * Handles chat interactions with streaming support
 */

import { apiRequest } from './client'

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
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<string, void, undefined> {
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

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      
      // Keep last incomplete line in buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          
          if (data === '[DONE]') {
            return
          }
          
          if (data.startsWith('[ERROR:')) {
            throw new Error(data)
          }
          
          yield data
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

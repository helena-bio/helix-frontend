/**
 * AI Chat Mutations
 * Handles streaming chat with AI service
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChatMessage, streamChatMessage, type ChatRequest } from '@/lib/api/ai'

/**
 * Buffered chat mutation (non-streaming)
 */
export function useAIChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ChatRequest) => {
      return sendChatMessage(request)
    },
    onError: (error) => {
      console.error('AI chat error:', error)
    },
  })
}

/**
 * Streaming chat hook
 * Usage:
 * 
 * const { streamMessage } = useAIChatStream()
 * 
 * await streamMessage({
 *   message: 'Hello',
 *   session_id: 'abc123',
 *   onToken: (token) => console.log(token),
 *   onComplete: (fullMessage) => console.log('Done:', fullMessage),
 *   onError: (error) => console.error(error)
 * })
 */
export function useAIChatStream() {
  const streamMessage = async ({
    message,
    conversation_id,
    session_id,
    onToken,
    onComplete,
    onError,
  }: {
    message: string
    conversation_id?: string
    session_id?: string
    onToken: (token: string) => void
    onComplete: (fullMessage: string) => void
    onError: (error: Error) => void
  }) => {
    let fullMessage = ''

    try {
      const stream = streamChatMessage({
        message,
        conversation_id,
        session_id,
      })

      for await (const token of stream) {
        fullMessage += token
        onToken(token)
      }

      onComplete(fullMessage)
    } catch (error) {
      onError(error as Error)
    }
  }

  return { streamMessage }
}

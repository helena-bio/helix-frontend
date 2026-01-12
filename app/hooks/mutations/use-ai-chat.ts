/**
 * AI Chat Mutations
 * Handles streaming chat with AI service and query visualizations
 */

import { useMutation } from '@tanstack/react-query'
import { sendChatMessage, streamChatMessage, type ChatRequest, type QueryResultEvent, type ConversationStartedEvent } from '@/lib/api/ai'

/**
 * Buffered chat mutation (non-streaming)
 */
export function useAIChat() {
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
 * Streaming chat hook with conversation continuity and query result support
 *
 * Usage:
 *
 * const { streamMessage } = useAIChatStream()
 *
 * await streamMessage({
 *   message: 'Show me ACMG distribution',
 *   conversation_id: 'uuid-here',  // Optional: pass for conversation continuity
 *   session_id: 'abc123',
 *   onConversationStarted: (conversationId) => setConversationId(conversationId),
 *   onToken: (token) => console.log(token),
 *   onQueryResult: (result) => console.log('Query result:', result),
 *   onComplete: (fullMessage) => console.log('Done:', fullMessage),
 *   onError: (error) => console.error(error)
 * })
 */
export function useAIChatStream() {
  const streamMessage = async ({
    message,
    conversation_id,
    session_id,
    onConversationStarted,
    onToken,
    onQueryResult,
    onComplete,
    onError,
  }: {
    message: string
    conversation_id?: string
    session_id?: string
    onConversationStarted?: (conversationId: string) => void
    onToken: (token: string) => void
    onQueryResult?: (result: QueryResultEvent) => void
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

      for await (const event of stream) {
        if (event.type === 'conversation_started') {
          // Conversation started - capture conversation_id
          if (onConversationStarted) {
            onConversationStarted(event.data.conversation_id)
          }
        } else if (event.type === 'token') {
          // Text token
          fullMessage += event.data
          onToken(event.data)
        } else if (event.type === 'query_result') {
          // Query result with visualization
          if (onQueryResult) {
            onQueryResult(event.data)
          }
        }
      }

      onComplete(fullMessage)
    } catch (error) {
      onError(error as Error)
    }
  }

  return { streamMessage }
}

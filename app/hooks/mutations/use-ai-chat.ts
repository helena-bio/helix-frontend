/**
 * AI Chat Mutations
 * Handles streaming chat with AI service and query visualizations
 */
import { useMutation } from '@tanstack/react-query'
import {
  sendChatMessage,
  streamChatMessage,
  type ChatRequest,
  type QueryResultEvent,
  type ConversationStartedEvent,
  type QueryingStartedEvent,
  type LiteratureSearchingEvent,
  type LiteratureResultEvent,
  type RoundCompleteEvent,
} from '@/lib/api/ai'

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
 * Events:
 * - onConversationStarted: Called with conversation_id at start
 * - onToken: Called for each text token
 * - onQueryingStarted: Called when AI starts database query (show indicator)
 * - onQueryResult: Called with query results (hide indicator, show results)
 * - onLiteratureSearching: Called when AI starts literature search
 * - onLiteratureResult: Called with literature search results
 * - onRoundComplete: Called after query, before next round (create new bubble)
 * - onComplete: Called when stream ends
 * - onError: Called on error
 */
export function useAIChatStream() {
  const streamMessage = async ({
    message,
    conversation_id,
    session_id,
    metadata,
    onConversationStarted,
    onToken,
    onQueryingStarted,
    onQueryResult,
    onLiteratureSearching,
    onLiteratureResult,
    onRoundComplete,
    onComplete,
    onError,
  }: {
    message: string
    conversation_id?: string
    session_id?: string
    metadata?: Record<string, any>
    onConversationStarted?: (conversationId: string) => void
    onToken: (token: string) => void
    onQueryingStarted?: () => void
    onQueryResult?: (result: QueryResultEvent) => void
    onLiteratureSearching?: () => void
    onLiteratureResult?: (result: LiteratureResultEvent) => void
    onRoundComplete?: () => void
    onComplete: () => void
    onError: (error: Error) => void
  }) => {
    try {
      const stream = streamChatMessage({
        message,
        conversation_id,
        session_id,
        metadata,
      })

      for await (const event of stream) {
        if (event.type === 'conversation_started') {
          if (onConversationStarted) {
            onConversationStarted(event.data.conversation_id)
          }
        } else if (event.type === 'token') {
          onToken(event.data)
        } else if (event.type === 'querying_started') {
          if (onQueryingStarted) {
            onQueryingStarted()
          }
        } else if (event.type === 'query_result') {
          if (onQueryResult) {
            onQueryResult(event.data)
          }
        } else if (event.type === 'literature_searching') {
          if (onLiteratureSearching) {
            onLiteratureSearching()
          }
        } else if (event.type === 'literature_result') {
          if (onLiteratureResult) {
            onLiteratureResult(event.data)
          }
        } else if (event.type === 'round_complete') {
          if (onRoundComplete) {
            onRoundComplete()
          }
        }
      }

      onComplete()
    } catch (error) {
      console.error('[STREAM ERROR]', error)
      onError(error as Error)
    }
  }

  return { streamMessage }
}

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
 * - onRoundComplete: Called after query, before next round (create new bubble)
 * - onComplete: Called when stream ends
 * - onError: Called on error
 *
 * Usage:
 *
 * const { streamMessage } = useAIChatStream()
 *
 * await streamMessage({
 *   message: 'Show me ACMG distribution',
 *   conversation_id: 'uuid-here',
 *   session_id: 'abc123',
 *   metadata: { phenotype_context: { ... } },
 *   onConversationStarted: (conversationId) => setConversationId(conversationId),
 *   onToken: (token) => appendToMessage(token),
 *   onQueryingStarted: () => setIsQuerying(true),
 *   onQueryResult: (result) => addQueryResult(result),
 *   onRoundComplete: () => createNewMessageBubble(),
 *   onComplete: () => setIsSending(false),
 *   onError: (error) => console.error(error)
 * })
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
          // Conversation started - capture conversation_id
          if (onConversationStarted) {
            onConversationStarted(event.data.conversation_id)
          }
        } else if (event.type === 'token') {
          // Text token
          onToken(event.data)
        } else if (event.type === 'querying_started') {
          // AI is querying database - show indicator
          if (onQueryingStarted) {
            onQueryingStarted()
          }
        } else if (event.type === 'query_result') {
          // Query result with visualization
          if (onQueryResult) {
            onQueryResult(event.data)
          }
        } else if (event.type === 'round_complete') {
          // Round complete - create new message bubble for next round
          if (onRoundComplete) {
            onRoundComplete()
          }
        }
      }

      onComplete()
    } catch (error) {
      onError(error as Error)
    }
  }

  return { streamMessage }
}

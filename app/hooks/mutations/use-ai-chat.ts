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
    let accumulatedContent = ''
    
    try {
      const stream = streamChatMessage({
        message,
        conversation_id,
        session_id,
        metadata,
      })

      for await (const event of stream) {
        if (event.type === 'conversation_started') {
          console.log('[STREAM] Conversation started:', event.data.conversation_id)
          if (onConversationStarted) {
            onConversationStarted(event.data.conversation_id)
          }
        } else if (event.type === 'token') {
          // Debug token
          const token = event.data
          accumulatedContent += token
          
          console.log('[STREAM TOKEN]', {
            token: token,
            tokenEscaped: token.replace(/\n/g, '\\n').replace(/\r/g, '\\r'),
            tokenLength: token.length,
            isNewline: token === '\n',
            isDoubleNewline: token === '\n\n',
            accumulatedLength: accumulatedContent.length,
            lastChars: accumulatedContent.slice(-20).replace(/\n/g, '\\n')
          })
          
          onToken(token)
        } else if (event.type === 'querying_started') {
          console.log('[STREAM] Querying started')
          console.log('[STREAM] Content before query:', accumulatedContent.replace(/\n/g, '\\n'))
          if (onQueryingStarted) {
            onQueryingStarted()
          }
        } else if (event.type === 'query_result') {
          console.log('[STREAM] Query result received')
          if (onQueryResult) {
            onQueryResult(event.data)
          }
        } else if (event.type === 'round_complete') {
          console.log('[STREAM] Round complete')
          console.log('[STREAM] Final content:', accumulatedContent.replace(/\n/g, '\\n'))
          if (onRoundComplete) {
            onRoundComplete()
          }
          accumulatedContent = '' // Reset for next round
        }
      }
      
      console.log('[STREAM] Complete - Final accumulated:', accumulatedContent.replace(/\n/g, '\\n'))
      onComplete()
    } catch (error) {
      console.error('[STREAM ERROR]', error)
      onError(error as Error)
    }
  }

  return { streamMessage }
}

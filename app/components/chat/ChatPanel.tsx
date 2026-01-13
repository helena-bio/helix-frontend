"use client"

import { useState, useRef, useEffect, memo } from 'react'
import { Send, Square, Sparkles, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { usePhenotypeContext } from '@/contexts/PhenotypeContext'
import { useAIChatStream } from '@/hooks/mutations/use-ai-chat'
import { QueryVisualization } from './QueryVisualization'
import ReactMarkdown from 'react-markdown'
import type { Message } from '@/types/ai.types'
import type { QueryResultEvent } from '@/lib/api/ai'

// ============================================================================
// MESSAGE COMPONENTS
// ============================================================================

const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'text' && message.content) {
    return (
      <div
        className={`rounded-2xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-primary/20'
        }`}
      >
        <div className="text-base leading-relaxed prose prose-sm dark:prose-invert max-w-none
          prose-p:my-2 prose-ul:my-2 prose-ol:my-2
          prose-strong:text-foreground prose-strong:font-semibold
          prose-em:text-foreground
          prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-muted prose-pre:text-foreground">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary/50 animate-pulse" />
          )}
        </div>
      </div>
    )
  }

  if (message.type === 'query_result' && message.queryData) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            View SQL Query
          </summary>
          <div className="mt-2 p-3 bg-muted rounded overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              <code>{message.queryData.sql}</code>
            </pre>
          </div>
        </details>

        {message.queryData.visualization && (
          <QueryVisualization
            data={message.queryData.results}
            config={message.queryData.visualization}
          />
        )}

        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span>{message.queryData.rows_returned} rows</span>
          <span>•</span>
          <span>{message.queryData.execution_time_ms}ms</span>
        </div>
      </div>
    )
  }

  return null
}, (prevProps, nextProps) => {
  const prev = prevProps.message
  const next = nextProps.message
  return (
    prev.id === next.id &&
    prev.content === next.content &&
    prev.isStreaming === next.isStreaming &&
    prev.type === next.type
  )
})

const ThinkingIndicator = memo(function ThinkingIndicator({ mode = 'thinking' }: { mode?: 'thinking' | 'querying' }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
        {mode === 'querying' ? (
          <Database className="h-4 w-4 text-primary animate-pulse" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        )}
      </div>
      <div className="px-4 py-3">
        <p className="text-base text-muted-foreground">
          {mode === 'querying' ? 'Querying database...' : 'Thinking...'}
        </p>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { currentSessionId, selectedModule } = useAnalysis()
  const { phenotype } = usePhenotypeContext()
  const { streamMessage } = useAIChatStream()

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0 && currentSessionId) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for variant analysis. I can help you understand the results, filter variants, and provide clinical insights. What would you like to know?",
        timestamp: new Date(),
        type: 'text',
      }])
    }
  }, [currentSessionId])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const cleanXMLTags = (content: string): string => {
    return content.replace(/<query_database>[\s\S]*?<\/query_database>/g, '')
  }

  const hasQueryTool = (content: string): boolean => {
    return /<query_database>/.test(content)
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      type: 'text',
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    const streamingMessageId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      type: 'text',
    }

    setMessages(prev => [...prev, streamingMessage])

    let queryDetected = false
    let continuationMessageId: string | null = null

    try {
      // Build phenotype metadata
      const metadata: Record<string, any> = {}

      if (phenotype && phenotype.hpo_terms.length > 0) {
        metadata.phenotype_context = {
          hpo_terms: phenotype.hpo_terms.map(t => ({
            hpo_id: t.hpo_id,
            name: t.name,
          })),
          hpo_ids: phenotype.hpo_terms.map(t => t.hpo_id),
          term_count: phenotype.term_count,
        }

        if (phenotype.clinical_notes) {
          metadata.phenotype_context.clinical_notes = phenotype.clinical_notes
        }
      }

      await streamMessage({
        message: userMessage.content,
        conversation_id: conversationId,
        session_id: currentSessionId || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        
        onConversationStarted: (id: string) => {
          setConversationId(id)
        },
        
        onToken: (token: string) => {
          setMessages(prev =>
            prev.map(msg => {
              // Handle main streaming message
              if (msg.id === streamingMessageId) {
                const newContent = msg.content + token

                // Query tool detected - freeze main message
                if (!queryDetected && hasQueryTool(newContent)) {
                  queryDetected = true
                  setIsQuerying(true)
                  return {
                    ...msg,
                    content: cleanXMLTags(newContent).trim(),
                    isStreaming: false,
                  }
                }

                // Normal streaming (before query detection)
                if (!queryDetected) {
                  return { ...msg, content: cleanXMLTags(newContent) }
                }

                return msg
              }

              // Handle continuation message (after query result)
              if (msg.id === continuationMessageId && queryDetected) {
                return { ...msg, content: msg.content + token }
              }

              return msg
            })
          )
        },
        
        onQueryResult: (result: QueryResultEvent) => {
          setIsQuerying(false)

          // Finalize main message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMessageId && msg.isStreaming
                ? { ...msg, isStreaming: false }
                : msg
            )
          )

          // Create query result message
          const queryResultMessageId = `${streamingMessageId}-query`
          const queryResultMessage: Message = {
            id: queryResultMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            type: 'query_result',
            queryData: {
              sql: result.sql,
              results: result.results,
              rows_returned: result.rows_returned,
              execution_time_ms: result.execution_time_ms,
              visualization: result.visualization,
            },
          }

          // Create continuation message for AI response after query
          continuationMessageId = `${streamingMessageId}-continuation`
          const continuationMessage: Message = {
            id: continuationMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            type: 'text',
          }

          // Insert query result + continuation after main message
          setMessages(prev => {
            const msgIndex = prev.findIndex(m => m.id === streamingMessageId)
            if (msgIndex === -1) return prev

            const newMessages = [...prev]
            newMessages.splice(msgIndex + 1, 0, queryResultMessage, continuationMessage)
            return newMessages
          })
        },
        
        onComplete: () => {
          setMessages(prev =>
            prev.map(msg => {
              if (msg.id === streamingMessageId || msg.id === continuationMessageId) {
                return { ...msg, isStreaming: false }
              }
              return msg
            })
          )
          setIsSending(false)
          setIsQuerying(false)
        },
        
        onError: (error: Error) => {
          console.error('[CHAT ERROR]', error)

          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMessageId
                ? {
                    ...msg,
                    content: `Error: ${error.message}. Please try again.`,
                    isStreaming: false,
                  }
                : msg
            )
          )
          setIsSending(false)
          setIsQuerying(false)
        },
      })
    } catch (error) {
      console.error('[STREAM INIT ERROR]', error)
      setIsSending(false)
      setIsQuerying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Determine if we should show thinking indicator
  const shouldShowThinking = isSending && (
    messages.length === 0 ||
    messages[messages.length - 1]?.content === '' ||
    isQuerying
  )

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground truncate">
              {selectedModule === 'vus'
                ? 'VUS Prioritization Assistant'
                : 'Variant Analysis Assistant'
              }
            </p>
          </div>
        </div>

        {/* Phenotype Context Indicator */}
        {phenotype && phenotype.hpo_terms.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{phenotype.term_count} phenotype{phenotype.term_count !== 1 ? 's' : ''} active</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6 max-w-4xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`${message.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                <MessageBubble message={message} />
              </div>
            </div>
          ))}

          {/* Thinking/Querying Indicator */}
          {shouldShowThinking && (
            <ThinkingIndicator mode={isQuerying ? 'querying' : 'thinking'} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 shrink-0 bg-background">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about variants, genes, or phenotypes..."
            rows={3}
            disabled={isSending}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
          >
            {isSending ? (
              <Square className="h-4 w-4" fill="currentColor" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}

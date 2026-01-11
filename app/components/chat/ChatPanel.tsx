"use client"

/**
 * ChatPanel - AI Assistant Chat Interface with Streaming
 * Real-time streaming responses from AI service
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useAIChatStream } from '@/hooks/mutations/use-ai-chat'
import type { Message } from '@/types/ai.types'

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { currentSessionId, selectedModule } = useAnalysis()
  const { streamMessage } = useAIChatStream()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message when chat opens
  useEffect(() => {
    if (messages.length === 0 && currentSessionId) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for variant analysis. I can help you understand the results, filter variants, and provide clinical insights. What would you like to know?",
        timestamp: new Date(),
      }])
    }
  }, [currentSessionId])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    // Create streaming message placeholder
    const streamingMessageId = (Date.now() + 1).toString()
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, streamingMessage])

    try {
      await streamMessage({
        message: userMessage.content,
        conversation_id: conversationId,
        session_id: currentSessionId || undefined,
        onToken: (token: string) => {
          // Update streaming message with new token
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          )
        },
        onComplete: (fullMessage: string) => {
          // Mark message as complete
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
          setIsSending(false)
        },
        onError: (error: Error) => {
          console.error('AI chat error:', error)
          
          // Update message with error
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
        },
      })
    } catch (error) {
      console.error('Stream initialization error:', error)
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6 max-w-2xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? '' : 'w-full'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-primary/20'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-line">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-primary/50 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isSending && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="px-4 py-3">
                <p className="text-base text-muted-foreground">Thinking...</p>
              </div>
            </div>
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

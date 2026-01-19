"use client"

import { Streamdown } from 'streamdown'
import { useEffect } from 'react'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const textColor = isUser ? 'text-primary-foreground' : 'text-foreground'
  
  useEffect(() => {
    console.group('=== MARKDOWN DEBUG ===')
    console.log('Content length:', content.length)
    console.log('Is user:', isUser)
    console.log('Raw content:', content)
    console.log('Content with visible newlines:', content.replace(/\n/g, '\\n'))
    console.log('Content split by \\n:', content.split('\n'))
    console.log('Content split by \\n\\n:', content.split('\n\n'))
    console.log('Has single newlines:', content.includes('\n'))
    console.log('Has double newlines:', content.includes('\n\n'))
    console.groupEnd()
  }, [content, isUser])
  
  return (
    <div className={`text-base leading-relaxed select-text ${textColor}`}>
      <Streamdown
        parseIncompleteMarkdown={true}
        className="prose prose-sm max-w-none"
      >
        {content}
      </Streamdown>
    </div>
  )
}

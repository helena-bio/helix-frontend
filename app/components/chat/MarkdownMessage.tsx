'use client'

import { Streamdown } from 'streamdown'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const textColor = isUser ? 'text-white' : 'text-gray-800'
  
  return (
    <div className={`text-base leading-relaxed select-text ${textColor}`}>
      <div className="markdown-content prose prose-sm max-w-none prose-invert">
        <Streamdown parseIncompleteMarkdown={true}>
          {content}
        </Streamdown>
      </div>
    </div>
  )
}

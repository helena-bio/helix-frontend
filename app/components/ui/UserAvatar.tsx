/**
 * UserAvatar Component
 *
 * Displays user initials with deterministic hash-based background color.
 * Palette: muted professional tones, white text for contrast.
 * Consistent color per user across sessions.
 */

'use client'

import { useMemo } from 'react'
import { cn } from '@helix/shared/lib/utils'

const AVATAR_COLORS = [
  '#5B7A8A',
  '#7A6B5D',
  '#6B7B6A',
  '#8A6B7A',
  '#5D6B8A',
  '#7A7B5D',
  '#6A5D7A',
  '#5D7A6B',
  '#8A7A5D',
  '#6B5D6A',
] as const

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

interface UserAvatarProps {
  fullName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
} as const

export function UserAvatar({ fullName, size = 'sm', className }: UserAvatarProps) {
  const initials = useMemo(() => getInitials(fullName), [fullName])
  const bgColor = useMemo(() => {
    const index = hashString(fullName) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }, [fullName])

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  )
}

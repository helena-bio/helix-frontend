/**
 * UserAvatar Component
 *
 * Displays user avatar with API image support and initials fallback.
 * Loads image from /auth/avatar/{userId} endpoint.
 * Background color is deterministic per user (hash-based).
 */
'use client'

import { useState, useMemo, useEffect } from 'react'
import { cn } from '@helix/shared/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'

const AVATAR_COLORS = [
  '#5B7A8A', '#7A6B5D', '#6B7B6A', '#8A6B7A', '#5D6B8A',
  '#7A7B5D', '#6A5D7A', '#5D7A6B', '#8A7A5D', '#6B5D6A',
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
  userId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  version?: number
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const

export function UserAvatar({ fullName, userId, size = 'sm', className, version }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const initials = useMemo(() => getInitials(fullName), [fullName])
  const bgColor = useMemo(() => {
    const index = hashString(fullName) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }, [fullName])

  // Reset image state when userId or version changes
  useEffect(() => {
    setImgError(false)
    setImgLoaded(false)
  }, [userId, version])

  const avatarUrl = userId
    ? `${API_URL}/auth/avatar/${userId}${version ? `?v=${version}` : ''}`
    : null

  const showImage = avatarUrl && !imgError

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden relative',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
      {showImage && (
        <img
          key={`${userId}-${version}`}
          src={avatarUrl}
          alt={fullName}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-200',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}

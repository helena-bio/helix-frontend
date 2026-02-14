"use client"

/**
 * Invite Modal
 *
 * Admin-only modal for sending organization invitations.
 * Calls POST /auth/invitations, displays generated invite link.
 */

import { useState } from 'react'
import { X, Loader2, Check, Copy, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { tokenUtils } from '@/lib/auth/token'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalState = 'form' | 'submitting' | 'success'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.helixinsight.bio'

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { user } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [modalState, setModalState] = useState<ModalState>('form')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setEmail('')
    setError('')
    setModalState('form')
    setInviteLink('')
    setCopied(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Email is required')
      return
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setModalState('submitting')

    try {
      const token = tokenUtils.get()
      const response = await fetch(`${API_URL}/auth/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmed,
          organization_id: user?.organization_id,
          role: 'user',
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail || `Failed to create invitation (${response.status})`)
      }

      const data = await response.json()
      setInviteLink(`${APP_URL}/invite?token=${data.token}`)
      setModalState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation')
      setModalState('form')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendAnother = () => {
    setEmail('')
    setError('')
    setInviteLink('')
    setCopied(false)
    setModalState('form')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {modalState === 'success' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <p className="text-base font-medium">Invitation created</p>
              </div>

              <p className="text-md text-muted-foreground">
                Share this link with <span className="font-medium text-foreground">{email}</span> to
                complete their registration. The invitation expires in 7 days.
              </p>

              {/* Invite link with copy */}
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 border border-border rounded-md bg-muted/30 text-md text-muted-foreground truncate select-all">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-2 border border-border rounded-md text-base font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSendAnother}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
                >
                  Invite another
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-md text-muted-foreground">
                Send an invitation to join <span className="font-medium text-foreground">{user?.organization_name || 'your organization'}</span>.
                They will receive a link to create their account.
              </p>

              <div className="space-y-2">
                <label htmlFor="invite-email" className="block text-base font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={modalState === 'submitting'}
                  placeholder="colleague@laboratory.com"
                  autoFocus
                  className="block w-full h-10 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              {error && (
                <p className="text-md text-destructive">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={modalState === 'submitting'}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {modalState === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalState === 'submitting' ? 'Creating...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={modalState === 'submitting'}
                  className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

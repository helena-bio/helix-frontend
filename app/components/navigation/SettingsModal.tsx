"use client"

/**
 * Settings Modal
 *
 * Editable user profile and password change.
 * Left navigation with sections, right content area.
 * Calls PUT /auth/profile and PUT /auth/password endpoints.
 */

import { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { tokenUtils } from '@/lib/auth/token'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsSection = 'general' | 'account'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, refreshAuth } = useAuth()
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Initialize form values when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const parts = (user.full_name || '').split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
      setProfileSuccess(false)
      setProfileError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(false)
      setPasswordError('')
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const sections: { id: SettingsSection; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' },
  ]

  const userInitial = (user?.full_name || 'U').charAt(0).toUpperCase()

  const handleProfileSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('First name and last name are required')
      return
    }

    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      const token = tokenUtils.get()
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to update profile')
      }

      setProfileSuccess(true)
      // Note: JWT won't update until next login, but we show success
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError('All fields are required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordSaving(true)
    setPasswordError('')
    setPasswordSuccess(false)

    try {
      const token = tokenUtils.get()
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to change password')
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left nav + Right content */}
        <div className="flex min-h-[400px]">
          {/* Left navigation */}
          <nav className="w-48 border-r border-border p-3 space-y-1 shrink-0">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-base transition-colors ${
                  activeSection === section.id
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Profile</h3>

                {/* Avatar + Email (read-only) */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold shrink-0">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">{user?.full_name || 'User'}</p>
                    <p className="text-md text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </div>

                {/* Editable profile fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Email</label>
                    <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-muted-foreground">
                      {user?.email || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Role</label>
                    <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-muted-foreground capitalize">
                      {user?.role || '-'}
                    </div>
                  </div>

                  {profileError && (
                    <p className="text-base text-destructive">{profileError}</p>
                  )}

                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : profileSuccess ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                    {profileSuccess ? 'Saved' : 'Save changes'}
                  </button>
                </div>

                {/* Password change section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Change password</h3>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-base text-destructive">{passwordError}</p>
                  )}

                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : passwordSuccess ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                    {passwordSuccess ? 'Password changed' : 'Change password'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Account</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Organization</label>
                    <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-foreground">
                      {user?.organization_name || 'Helena Bioinformatics'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Plan</label>
                    <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-foreground">
                      Partner
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-1">Organization ID</label>
                    <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-md text-muted-foreground font-mono">
                      {user?.organization_id || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

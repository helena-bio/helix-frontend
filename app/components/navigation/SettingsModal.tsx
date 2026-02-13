"use client"

/**
 * Settings Modal
 *
 * Editable user profile, avatar upload, and password change.
 * Left navigation with sections, right content area.
 * Calls PUT /auth/profile, POST /auth/avatar, PUT /auth/password endpoints.
 */

import { useState, useEffect, useRef } from 'react'
import { X, Check, Loader2, Camera, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { tokenUtils } from '@/lib/auth/token'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { AvatarCropModal } from '@/components/ui/AvatarCropModal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsSection = 'general' | 'account'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth()
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Avatar
  const [avatarVersion, setAvatarVersion] = useState(1)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password form
  const [showPasswordForm, setShowPasswordForm] = useState(false)
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
      setAvatarFile(null)
      setShowPasswordForm(false)
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setProfileError('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be smaller than 5MB')
      return
    }

    setProfileError('')
    setAvatarFile(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleAvatarSaved = () => {
    setAvatarFile(null)
    setAvatarVersion((v) => v + 1)
  }

  const handleAvatarDelete = async () => {
    setDeletingAvatar(true)
    try {
      const token = tokenUtils.get()
      await fetch(`${API_URL}/auth/avatar`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setAvatarVersion((v) => v + 1)
    } catch {
      // Silent failure for delete
    } finally {
      setDeletingAvatar(false)
    }
  }

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

      updateUser({
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      })

      setProfileSuccess(true)
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
      setTimeout(() => {
        setPasswordSuccess(false)
        setShowPasswordForm(false)
      }, 2000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleCancelPassword = () => {
    setShowPasswordForm(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
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
        <div className="flex h-[520px]">
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

                {/* Avatar with upload overlay */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="cursor-pointer" onClick={handleAvatarClick}>
                      <UserAvatar
                        fullName={user?.full_name || "User"}
                        userId={user?.id}
                        size="xl"
                        version={avatarVersion}
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">{user?.full_name || 'User'}</p>
                    <p className="text-md text-muted-foreground">{user?.email || ''}</p>
                    <button
                      onClick={handleAvatarDelete}
                      disabled={deletingAvatar}
                      className="flex items-center gap-1 mt-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingAvatar ? 'Removing...' : 'Remove photo'}
                    </button>
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

                {/* Password section */}
                <div className="border-t border-border pt-6">
                  {!showPasswordForm ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Password</h3>
                        <p className="text-sm text-muted-foreground mt-1">Last changed: unknown</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="px-4 py-2 border border-border rounded-md text-base font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        Change password
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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

                      <div className="flex items-center gap-3">
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
                          {passwordSuccess ? 'Password changed' : 'Update password'}
                        </button>
                        <button
                          onClick={handleCancelPassword}
                          disabled={passwordSaving}
                          className="px-4 py-2 border border-border rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar crop modal */}
      {avatarFile && (
        <AvatarCropModal
          imageFile={avatarFile}
          onSave={handleAvatarSaved}
          onCancel={() => setAvatarFile(null)}
        />
      )}
    </div>
  )
}

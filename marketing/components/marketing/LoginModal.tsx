"use client"

import { useState } from 'react'
import { X } from 'lucide-react'
import { useLoginModal } from '@/contexts/LoginModalContext'
import { useAuth } from '@/contexts/AuthContext'
import type { LoginRequest } from '@/lib/types/auth'

export function LoginModal() {
  const { isOpen, closeModal } = useLoginModal()
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(formData)
      // Redirect happens in login function
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleClose = () => {
    closeModal()
    // Reset state after animation
    setTimeout(() => {
      setFormData({ email: '', password: '' })
      setError('')
    }, 300)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Partner Login</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-base font-medium text-foreground mb-1">
              Email address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-base font-medium text-foreground mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <p className="text-center text-md text-muted-foreground pt-2">
            Need access?{' '}
            <button
              type="button"
              onClick={() => {
                handleClose()
                // Open demo modal
                const demoEvent = new CustomEvent('openDemoModal')
                window.dispatchEvent(demoEvent)
              }}
              className="text-primary hover:underline font-medium"
            >
              Request demo
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

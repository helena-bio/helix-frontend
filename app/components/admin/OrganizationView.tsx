"use client"

/**
 * Organization View
 *
 * Admin component for viewing and editing organization details.
 * OrganizationContent: standalone content (used by Admin page)
 * OrganizationView: full-page wrapper (used by legacy route)
 */

import { useState, useEffect } from 'react'
import { Check, Loader2, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { fetchOrganization, updateOrganization, OrganizationDetails } from '@/lib/api/admin'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function tierLabel(tier: string) {
  const labels: Record<string, string> = {
    founding_partner: 'Founding Partner',
    vip: 'VIP',
    standard: 'Standard',
    trial: 'Trial',
  }
  return labels[tier] || tier
}

export function OrganizationContent() {
  const [org, setOrg] = useState<OrganizationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    loadOrganization()
  }, [])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      const data = await fetchOrganization()
      setOrg(data)
      setName(data.name)
      setContactEmail(data.contact_email || '')
      setWebsiteUrl(data.website_url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError('Organization name is required')
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const updated = await updateOrganization({
        name: name.trim(),
        contact_email: contactEmail.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
      })
      setOrg(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-base text-destructive">{error}</div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Organization</h3>
        <p className="text-md text-muted-foreground mt-1">Manage your organization settings</p>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{org?.name}</p>
              <p className="text-base text-muted-foreground">
                {tierLabel(org?.partner_tier || '')} &middot; Member since {formatDate(org?.created_at || '')}
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Organization name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Contact email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Website</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Read-only fields */}
            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Slug</label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-muted-foreground">
                {org?.slug || '-'}
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Partner tier</label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-muted-foreground">
                {tierLabel(org?.partner_tier || '')}
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Status</label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted/30 text-base text-muted-foreground capitalize">
                {org?.status || '-'}
              </div>
            </div>

            {saveError && (
              <p className="text-base text-destructive">{saveError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4" />
              ) : null}
              {saveSuccess ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function OrganizationView() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto px-6 py-8">
        <OrganizationContent />
      </div>
    </div>
  )
}

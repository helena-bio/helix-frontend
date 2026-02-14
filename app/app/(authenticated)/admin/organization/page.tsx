/**
 * Admin Organization Page
 *
 * Renders organization settings for admin users.
 * Non-admin users are redirected to dashboard.
 */
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OrganizationView } from '@/components/admin/OrganizationView'

export default function AdminOrganizationPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || user?.role !== 'admin') {
    return null
  }

  return <OrganizationView />
}

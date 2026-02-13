/**
 * Admin Team Management Page
 *
 * Renders the team members view for admin users.
 * Non-admin users are redirected to dashboard.
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { TeamMembersView } from '@/components/admin/TeamMembersView'

export default function AdminTeamPage() {
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

  return <TeamMembersView />
}

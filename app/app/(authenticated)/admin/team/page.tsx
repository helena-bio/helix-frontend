/**
 * Legacy Admin Team Route
 * Redirects to unified /admin page.
 */
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminTeamPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin') }, [router])
  return null
}

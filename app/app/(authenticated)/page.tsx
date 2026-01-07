/**
 * Dashboard Page
 * Main home view after authentication
 * Redirects directly to analysis for streamlined workflow
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Direct redirect to analysis page
    router.push('/analysis')
  }, [router])

  return null
}

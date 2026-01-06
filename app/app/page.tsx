/**
 * Root Page - Check Auth and Redirect
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('helix_auth_token')
    
    if (token) {
      // Already logged in - stay on authenticated page
      // Do nothing, let the authenticated layout render
    } else {
      // Not logged in - redirect to login
      router.push('/login')
    }
  }, [router])

  // Show nothing while checking
  return null
}

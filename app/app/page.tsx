/**
 * Root Page - Redirect to Login
 */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}

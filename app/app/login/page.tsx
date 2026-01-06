/**
 * Login Page
 * Fixed credentials: admin/admin
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@helix/shared/components/ui/button'
import { Input } from '@helix/shared/components/ui/input'
import { Label } from '@helix/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@helix/shared/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Fixed credentials check
    if (email === 'admin' && password === 'admin') {
      // Store auth token (dummy for now)
      localStorage.setItem('helix_auth_token', 'dummy-token')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } else {
      setError('Invalid credentials. Use admin/admin')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-8">
      {/* Logo outside card */}
      <div className="flex items-center gap-2">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/helix%20logo-W2SpmbzgUEDwJyPjRhIvWwSfESe6Aq.png"
          alt="Helix Insight"
          width={140}
          height={40}
          className="h-10 w-auto"
        />
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
          alt=""
          width={28}
          height={35}
          className="h-9 w-auto"
        />
      </div>

      {/* Card with form */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">
            Sign in to continue your analysis
          </CardTitle>
          <CardDescription className="text-center">
            Secure access to AI-powered variant interpretation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign up here
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Login Page
 *
 * Authenticates against User Management Service (port 9008).
 * Stores JWT in cookie for cross-subdomain compatibility.
 * Uses same visual header/footer as marketing site.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { tokenUtils } from '@/lib/auth/token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    organization_name: string;
    organization_id: string;
    role: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (tokenUtils.isValid()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || `Authentication failed (${response.status})`;
        throw new Error(message);
      }

      const data: LoginResponse = await response.json();

      // Save JWT to cookie (shared domain with marketing site)
      tokenUtils.save(data.access_token);

      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Autofill override */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px hsl(var(--background)) inset !important;
          -webkit-text-fill-color: hsl(var(--foreground)) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Header */}
      <header className="h-14 border-b border-border bg-card shrink-0">
        <div className="h-full flex items-center gap-6 overflow-hidden">
          <Link href="https://helixinsight.bio" className="flex items-center gap-2 shrink-0 pl-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/helix%20logo-W2SpmbzgUEDwJyPjRhIvWwSfESe6Aq.png"
              alt="Helix Insight"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bulb-KpLU35CozLLzkwRErx9HXQNX4gHefR.png"
              alt=""
              width={32}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Sign in to continue your analysis
            </h1>
            <p className="text-base text-muted-foreground">
              Secure access to AI-powered variant interpretation
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-base text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-base font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-base font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-md text-muted-foreground">
              <a href="https://helena.bio" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Helena Bioinformatics</a>{' '}
              &copy; 2026. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-md">
              <a href="https://helixinsight.bio/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="https://helixinsight.bio/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

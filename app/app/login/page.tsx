/**
 * Login Page
 *
 * Authenticates against User Management Service (port 9008).
 * Stores JWT in cookie for cross-subdomain compatibility.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      <header className="border-b border-border/40 bg-background/95">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">Helix Insight</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Sign in to continue your analysis
            </h1>
            <p className="text-sm text-foreground/60">
              Secure access to AI-powered variant interpretation
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
                  className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
                  className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="container text-center text-sm text-foreground/60">
          2025 Helena Bioinformatics
        </div>
      </footer>
    </div>
  );
}

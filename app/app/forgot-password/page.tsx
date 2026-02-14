/**
 * Forgot Password Page
 *
 * Requests password reset email. Always shows success message
 * regardless of whether email exists (prevents enumeration).
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ||
          errorData?.detail ||
          'Something went wrong. Please try again.';
        throw new Error(message);
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
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
              src="/images/logos/logo_bulb.svg"
              alt=""
              width={32}
              height={40}
              className="h-11 w-auto"
              priority
            />
            <Image
              src="/images/logos/logo_helix.svg"
              alt="Helix Insight"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex flex-1 items-center justify-end gap-8 mr-6">
            <a href="https://helixinsight.bio/about" className="text-base text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="https://helixinsight.bio/contact" className="text-base text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Reset your password
            </h1>
            <p className="text-base text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            {isSubmitted ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-foreground">
                      Check your email
                    </p>
                    <p className="text-md text-muted-foreground leading-relaxed">
                      If an account exists for <span className="font-medium text-foreground">{email}</span>,
                      we sent a password reset link. The link expires in 30 minutes.
                    </p>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full h-11 rounded-md border border-border bg-background text-foreground text-base font-medium hover:bg-secondary/50 transition-colors"
                  >
                    Try a different email
                  </button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </form>
            )}
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
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-md">
              <a href="https://helixinsight.bio/privacy" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Privacy Policy
              </a>
              <a href="https://helixinsight.bio/terms" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Terms of Service
              </a>
              <a href="https://helixinsight.bio/dpa" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                DPA
              </a>
              <a href="https://helixinsight.bio/dpia" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                DPIA
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

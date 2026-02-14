/**
 * Reset Password Page
 *
 * User arrives here from email link: /reset-password?token=<uuid>
 * Validates token and sets new password.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect countdown after success
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push('/login'), 4000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ||
          errorData?.detail ||
          'Password reset failed. Please try again.';
        throw new Error(message);
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL
  const noToken = !token;

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
              Set a new password
            </h1>
            <p className="text-base text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            {noToken ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-base text-destructive">
                    Invalid or missing reset link.
                  </p>
                </div>
                <p className="text-md text-muted-foreground text-center">
                  This link may be incomplete. Please use the full link from your email
                  or request a new one.
                </p>
                <Link
                  href="/forgot-password"
                  className="flex items-center justify-center w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors"
                >
                  Request New Reset Link
                </Link>
              </div>
            ) : isSuccess ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-foreground">
                      Password reset successfully
                    </p>
                    <p className="text-md text-muted-foreground">
                      Redirecting to sign in...
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign In Now
                </Link>
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
                  <label htmlFor="newPassword" className="block text-base font-medium text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="Uppercase, lowercase, digit, special characters"
                      className="block w-full h-11 rounded-md border border-border bg-background px-3 pr-10 text-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-base font-medium text-foreground">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      disabled={isLoading}
                      placeholder="Repeat your new password"
                      className="block w-full h-11 rounded-md border border-border bg-background px-3 pr-10 text-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
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

/**
 * Invitation Accept Page
 *
 * Validates invitation token from URL, shows org/email (read-only),
 * collects first name, last name, password to create account.
 * On success, saves JWT and redirects to dashboard.
 *
 * URL format: /invite?token=<uuid>
 * Backend: GET /auth/invitations/{token} (validate)
 *          POST /auth/invitations/{token}/accept (create account)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Loader2, Building2, Mail, Check } from 'lucide-react';
import { tokenUtils } from '@/lib/auth/token';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9008';

interface InvitationInfo {
  token: string;
  email: string;
  organization_name: string;
  organization_id: string;
  status: string;
  expires_at: string;
}

interface AcceptResponse {
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

type PageState = 'loading' | 'ready' | 'invalid' | 'expired' | 'submitting' | 'success';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();

  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (tokenUtils.isValid()) {
      router.push('/');
    }
  }, [router]);

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }

    async function validateToken() {
      try {
        const response = await fetch(`${API_URL}/auth/invitations/${token}`);

        if (response.status === 410) {
          setPageState('expired');
          return;
        }

        if (!response.ok) {
          setPageState('invalid');
          return;
        }

        const data: InvitationInfo = await response.json();
        setInvitation(data);
        setPageState('ready');
      } catch {
        setPageState('invalid');
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setPageState('submitting');

    try {
      const response = await fetch(`${API_URL}/auth/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || data?.detail || `Registration failed (${response.status})`);
      }

      const data: AcceptResponse = await response.json();

      // Save JWT and update auth state
      tokenUtils.save(data.access_token);
      refreshAuth();

      setPageState('success');

      // Brief pause to show success, then redirect
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setPageState('ready');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
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

      {/* Header - matches login page */}
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
        {/* Loading state */}
        {pageState === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-base text-muted-foreground">Validating invitation...</p>
          </div>
        )}

        {/* Invalid token */}
        {pageState === 'invalid' && (
          <div className="w-full max-w-md text-center space-y-4">
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Invalid Invitation</h1>
              <p className="text-base text-muted-foreground">
                This invitation link is not valid. Please check the link or contact your administrator.
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Expired token */}
        {pageState === 'expired' && (
          <div className="w-full max-w-md text-center space-y-4">
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm space-y-4">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Invitation Expired</h1>
              <p className="text-base text-muted-foreground">
                This invitation has expired or has already been used. Please contact your administrator for a new invitation.
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Success state */}
        {pageState === 'success' && (
          <div className="w-full max-w-md text-center space-y-4">
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm space-y-4">
              <Check className="h-12 w-12 text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Account Created</h1>
              <p className="text-base text-muted-foreground">
                Welcome to Helix Insight. Redirecting to your dashboard...
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
            </div>
          </div>
        )}

        {/* Registration form */}
        {(pageState === 'ready' || pageState === 'submitting') && invitation && (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Create your account
              </h1>
              <p className="text-base text-muted-foreground">
                Complete your registration to get started
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

                {/* Organization (read-only) */}
                <div className="space-y-2">
                  <label className="block text-base font-medium text-foreground">
                    Organization
                  </label>
                  <div className="flex items-center gap-2 h-11 rounded-md border border-border bg-muted/30 px-3">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-base text-muted-foreground">{invitation.organization_name}</span>
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <label className="block text-base font-medium text-foreground">
                    Email address
                  </label>
                  <div className="flex items-center gap-2 h-11 rounded-md border border-border bg-muted/30 px-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-base text-muted-foreground">{invitation.email}</span>
                  </div>
                </div>

                {/* First name */}
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-base font-medium text-foreground">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={pageState === 'submitting'}
                    placeholder="Enter your first name"
                    className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                {/* Last name */}
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-base font-medium text-foreground">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={pageState === 'submitting'}
                    placeholder="Enter your last name"
                    className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-base font-medium text-foreground">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={pageState === 'submitting'}
                    placeholder="Min 8 chars, uppercase, number, special"
                    className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-base font-medium text-foreground">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={pageState === 'submitting'}
                    placeholder="Repeat your password"
                    className="block w-full h-11 rounded-md border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pageState === 'submitting'}
                  className="w-full h-11 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {pageState === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pageState === 'submitting' ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer - matches login page */}
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

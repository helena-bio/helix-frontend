/**
 * Application Providers
 * Wraps app with all necessary context providers
 *
 * NOTE: Session-specific providers (ClinicalInterpretation, ClinicalProfile, etc.)
 * are in authenticated layout, not here. Root providers are only for global state.
 */
'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@helix/shared/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { JourneyProvider } from '@/contexts/JourneyContext'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <SessionProvider>
            <JourneyProvider>
              {children}
              <Toaster />
            </JourneyProvider>
          </SessionProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  )
}

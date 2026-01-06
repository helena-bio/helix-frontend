/**
 * Dashboard Page
 * Main home view after authentication
 */
'use client'

import { useAnalysis } from '@/contexts/AnalysisContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Microscope, FileCode, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { setSelectedModule, currentSessionId } = useAnalysis()

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Helix Insight</h1>
          <p className="text-lg text-muted-foreground">
            AI-powered clinical variant interpretation platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Variant Analysis
              </CardTitle>
              <CardDescription>
                Upload and analyze VCF files with AI-powered ACMG classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analysis">
                <Button className="w-full">Start Analysis</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-primary" />
                VUS Intelligence
              </CardTitle>
              <CardDescription>
                Automated literature mining for variants of unknown significance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Coming Soon</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Phenotype Matching
              </CardTitle>
              <CardDescription>
                Match variants to patient phenotypes using HPO terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Session Info */}
        {currentSessionId && (
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Session</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentSessionId}</p>
                </div>
                <Link href="/analysis">
                  <Button>Continue Analysis</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

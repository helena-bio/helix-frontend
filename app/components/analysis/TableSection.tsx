"use client"

/**
 * Table Section - Data Consumer
 * This component DOES re-render when data changes
 * Completely isolated from filters
 */

import { useVariants } from '@/hooks/queries'
import { useVariantsFilter } from './VariantsFilterContext'
import { VariantsTable } from './VariantsTable'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

interface TableSectionProps {
  sessionId: string
}

export function TableSection({ sessionId }: TableSectionProps) {
  const { activeFilters, setPage } = useVariantsFilter()

  console.log('🔄 TableSection render') // Debug log

  // Subscribe to data - this WILL cause re-renders
  const { data, isLoading, error, isFetching } = useVariants(sessionId, activeFilters)

  // Initial Loading
  if (isLoading && !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error State
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="text-base font-medium">Failed to load variants</p>
              <p className="text-md text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <VariantsTable
          data={data}
          isFetching={isFetching}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  )
}

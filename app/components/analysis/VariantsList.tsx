"use client"

/**
 * VariantsList - Orchestrator Component
 * Provides filter context and composes isolated sections
 * This component itself does NOT re-render frequently
 */

import { VariantsFilterProvider, useVariantsFilter } from './VariantsFilterContext'
import { FilterSection } from './FilterSection'
import { TableSection } from './TableSection'
import { useVariants } from '@/hooks/queries'
import { CardHeader } from '@/components/ui/card'

interface VariantsListProps {
  sessionId: string
}

// Inner component that uses filter context
function VariantsListInner({ sessionId }: VariantsListProps) {
  const { activeFilters } = useVariantsFilter()

  console.log('📋 VariantsListInner render') // Debug log

  // We need isFetching and data for FilterSection header
  // But we query with staleTime to minimize re-fetches
  const { data, isFetching } = useVariants(sessionId, activeFilters, {
    staleTime: 1000, // Cache for 1 second to avoid duplicate requests
  })

  return (
    <div className="space-y-4">
      {/* Filter Section - Isolated, stable */}
      <div className="bg-card rounded-lg border">
        <CardHeader>
          <FilterSection
            isFetching={isFetching}
            totalCount={data?.total_count}
            currentCount={data?.variants.length}
          />
        </CardHeader>
      </div>

      {/* Table Section - Data consumer, re-renders on data change */}
      <TableSection sessionId={sessionId} />
    </div>
  )
}

// Main exported component
export function VariantsList({ sessionId }: VariantsListProps) {
  console.log('🌳 VariantsList (Provider) render') // Debug log

  return (
    <VariantsFilterProvider>
      <VariantsListInner sessionId={sessionId} />
    </VariantsFilterProvider>
  )
}
